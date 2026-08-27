import { NextRequest, NextResponse } from 'next/server';
import { createClient, type PostgrestSingleResponse } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';
import type { PromptFolder } from '@/types/prompts';

interface FolderPlan {
  name: string;
  icon: string;
  description: string;
  promptIndices: number[];
}

interface OrganizationPlan {
  folders: FolderPlan[];
  uncategorized: number[];
}

/**
 * POST /api/prompts/ai-organize
 * Use AI to analyze and organize user's prompt history into folders
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // 2. Get all user's prompts from images table
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('id, prompt, style, thumbnail_url, processed_image_url, created_at')
      .eq('user_id', user.id)
      .not('prompt', 'is', null)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (imagesError) {
      console.error('Error fetching images:', imagesError);
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No prompts found to organize' },
        { status: 400 }
      );
    }

    // 3. Deduplicate prompts (keep unique prompt texts)
    const uniquePromptsMap = new Map();
    images.forEach(img => {
      if (!uniquePromptsMap.has(img.prompt)) {
        uniquePromptsMap.set(img.prompt, img);
      }
    });
    const uniquePrompts = Array.from(uniquePromptsMap.values());

    console.log(`Found ${uniquePrompts.length} unique prompts to organize`);

    // 4. Check if already have saved prompts (avoid re-organizing)
    const { data: existingSaved } = await supabase
      .from('saved_prompts')
      .select('last_image_id')
      .eq('user_id', user.id);

    const savedImageIds = new Set(existingSaved?.map(s => s.last_image_id) || []);

    // Only organize prompts that haven't been saved yet
    const newPrompts = uniquePrompts.filter(img => !savedImageIds.has(img.id));

    if (newPrompts.length === 0) {
      return NextResponse.json(
        { error: 'All prompts have already been organized' },
        { status: 400 }
      );
    }

    console.log(`Organizing ${newPrompts.length} new prompts`);

    // 5. Prepare AI prompt
    const promptsList = newPrompts
      .map((p, i) => `${i + 1}. ${p.prompt}`)
      .join('\n');

    const aiPrompt = `你是一个专业的 AI 图片提示词分析专家。我有以下 ${newPrompts.length} 条图片生成提示词，请帮我：

1. 分析每条 prompt 的主题、风格、用途
2. 将相似的 prompts 分组（建议 3-8 个组，每组至少 2 条）
3. 为每个组生成一个简洁的中文文件夹名称（2-6 个字）
4. 为每个文件夹选择合适的 emoji 图标

分类维度参考：
- 主题：人物、动物、风景、建筑、抽象、食物等
- 风格：写实、卡通、水彩、油画、3D、像素风等
- 用途：头像、壁纸、海报、插画、LOGO 等
- 情绪：快乐、悲伤、神秘、梦幻、科技感等

提示词列表：
${promptsList}

请自动识别每条 prompt 的语言（默认认为是英语），并在整理分类时使用该语言给出分析描述。

请以 JSON 格式返回结果，确保 JSON 格式正确：
{
  "folders": [
    {
      "name": "人物肖像",
      "icon": "👤",
      "description": "包含人物、肖像相关的提示词",
      "promptIndices": [1, 5, 12]
    }
  ],
  "uncategorized": [4, 9]
}

注意：promptIndices 是上面列表的序号（从 1 开始）`;

    // 6. Call Gemini API
    console.log('Calling Gemini API for analysis...');

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: aiPrompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            response_mime_type: 'application/json'
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json(
        { error: 'AI analysis failed' },
        { status: 500 }
      );
    }

    const geminiResult = await geminiResponse.json();
    const aiResponseText = geminiResult.candidates[0].content.parts[0].text;

    console.log('AI Response:', aiResponseText);

    let organizationPlan: OrganizationPlan;
    try {
      organizationPlan = JSON.parse(aiResponseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // 7. Create folders and save prompts
    const createdFolders = [];
    let totalSaved = 0;

    for (const folderPlan of organizationPlan.folders) {
      // Create folder
      const folderInsert: PostgrestSingleResponse<PromptFolder> = await supabase
        .from('prompt_folders')
        .insert({
          user_id: user.id,
          name: folderPlan.name,
          icon: folderPlan.icon,
          sort_order: createdFolders.length
        })
        .select()
        .single();

      const folder: PromptFolder | null = folderInsert.data;
      const folderError = folderInsert.error;

      if (folderError) {
        console.error('Error creating folder:', folderError);
        continue;
      }
      if (!folder) {
        console.error('Folder creation returned empty data');
        continue;
      }

      // Prepare prompts to save
      const promptsToSave = folderPlan.promptIndices
        .map(idx => {
          const img = newPrompts[idx - 1];
          if (!img) return null;

          return {
            user_id: user.id,
            folder_id: folder.id,
            title: img.prompt.substring(0, 50),
            prompt_text: img.prompt,
            last_image_id: img.id,
            thumbnail_url: img.thumbnail_url || img.processed_image_url
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      // Save prompts
      const { error: saveError } = await supabase
        .from('saved_prompts')
        .insert(promptsToSave);

      if (saveError) {
        console.error('Error saving prompts:', saveError);
      } else {
        totalSaved += promptsToSave.length;
        createdFolders.push({
          id: folder.id,
          name: folder.name,
          icon: folder.icon,
          promptCount: promptsToSave.length
        });
      }
    }

    // 8. Handle uncategorized prompts (save to "其他" folder)
    if (organizationPlan.uncategorized && organizationPlan.uncategorized.length > 0) {
      const otherFolderInsert: PostgrestSingleResponse<PromptFolder> = await supabase
        .from('prompt_folders')
        .insert({
          user_id: user.id,
          name: '未分类',
          icon: '📦',
          sort_order: createdFolders.length
        })
        .select()
        .single();

      const otherFolder: PromptFolder | null = otherFolderInsert.data;

      if (otherFolder) {
        const uncategorizedPrompts = organizationPlan.uncategorized
          .map(idx => {
            const img = newPrompts[idx - 1];
            if (!img) return null;

            return {
              user_id: user.id,
              folder_id: otherFolder.id,
              title: img.prompt.substring(0, 50),
              prompt_text: img.prompt,
              last_image_id: img.id,
              thumbnail_url: img.thumbnail_url || img.processed_image_url
            };
          })
          .filter((p): p is NonNullable<typeof p> => p !== null);

        await supabase
          .from('saved_prompts')
          .insert(uncategorizedPrompts);

        totalSaved += uncategorizedPrompts.length;
        createdFolders.push({
          id: otherFolder.id,
          name: otherFolder.name,
          icon: otherFolder.icon,
          promptCount: uncategorizedPrompts.length
        });
      }
    }

    // 9. Return success response
    return NextResponse.json({
      success: true,
      summary: {
        totalPrompts: newPrompts.length,
        foldersCreated: createdFolders.length,
        promptsSaved: totalSaved,
        uncategorized: organizationPlan.uncategorized?.length || 0
      },
      folders: createdFolders
    });

  } catch (error) {
    console.error('Error in AI organize:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
