import Header from '@/components/common/HeaderSimple';
import PromptAssistant from '@/components/PromptAssistant';

export default function AIPromptAssistantPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PromptAssistant />
    </div>
  );
}