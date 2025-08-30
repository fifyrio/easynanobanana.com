import Header from '@/components/common/HeaderSimple';
import BackgroundRemover from '@/components/BackgroundRemover';

export default function RemoveBackgroundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <BackgroundRemover />
    </div>
  );
}