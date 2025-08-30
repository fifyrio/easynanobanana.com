import Header from '@/components/common/HeaderSimple';
import ImageEditor from '@/components/ImageEditor';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ImageEditor />
    </div>
  );
}