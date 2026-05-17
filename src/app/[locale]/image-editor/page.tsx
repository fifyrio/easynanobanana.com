import Header from '@/components/common/Header';
import ImageEditor from '@/components/ImageEditor';
import AiToolsShowcase from '@/components/AiToolsShowcase';

export default function ImageEditorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ImageEditor />
      <AiToolsShowcase />
    </div>
  );
}