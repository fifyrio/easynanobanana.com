import { NextRequest, NextResponse } from 'next/server';
import { getKIETaskMetadata } from '@/lib/r2';

/**
 * KIE Task Status Polling Endpoint
 *
 * Allows clients to check the status of their image generation tasks.
 * Reads task metadata from R2 storage.
 *
 * Usage:
 *   GET /api/kie/task-status?taskId=xxx
 *
 * Response:
 *   {
 *     "taskId": "kie-task-abc123",
 *     "status": "completed",
 *     "resultUrls": ["https://cdn.example.com/image.png"],
 *     "createdAt": "2025-01-11T10:00:00Z",
 *     "updatedAt": "2025-01-11T10:00:18Z"
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    // Validate taskId parameter
    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId parameter required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking status for task: ${taskId}`);

    // Read metadata from R2
    const metadata = await getKIETaskMetadata(taskId);

    if (!metadata) {
      console.log(`❌ Task not found: ${taskId}`);
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Task status: ${metadata.status}`);

    // Return task status
    return NextResponse.json({
      taskId: metadata.taskId,
      status: metadata.status,
      prompt: metadata.prompt,
      resultUrls: metadata.resultUrls,
      error: metadata.error,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      consumeCredits: metadata.consumeCredits,
      costTime: metadata.costTime,
    });

  } catch (error) {
    console.error('❌ Task status query error:', error);
    return NextResponse.json(
      {
        error: 'Failed to query task status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
