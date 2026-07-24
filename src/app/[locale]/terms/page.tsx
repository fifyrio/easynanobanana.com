'use client';

import Header from '@/components/common/Header';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Terms of Service
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8 text-center">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using this service, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please 
                do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                Our service provides AI-powered image generation, editing, and enhancement tools. 
                The service includes but is not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>AI image generation from text prompts</li>
                <li>Background removal and image editing</li>
                <li>Image enhancement and style transfer</li>
                <li>Template-based image creation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                To access certain features of the service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              <p className="text-gray-700 mb-4">
                This Acceptable Use Policy applies to all content you upload to, generate with, or
                share through the service, including ImageStudio and all AI image and video
                generation features.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Content Standards — Prohibited Content</h3>
              <p className="text-gray-700 mb-4">
                You may not use the service to create, upload, generate, or distribute:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>
                  <strong>Pornographic or NSFW content:</strong> sexually explicit material, nudity
                  intended to be sexual, or other adult content
                </li>
                <li>
                  <strong>Violent or graphic content:</strong> gratuitous violence, gore, or content
                  that glorifies or incites harm against people or animals
                </li>
                <li>
                  <strong>Hate speech:</strong> content that promotes hatred, discrimination, or
                  harassment based on race, ethnicity, religion, gender, sexual orientation,
                  disability, or any other protected characteristic
                </li>
                <li>
                  <strong>Child sexual abuse material (CSAM) and child-unsafe content:</strong> any
                  sexualized depiction of minors, real or generated, is strictly prohibited and will
                  be reported to relevant authorities (including NCMEC where applicable)
                </li>
                <li>
                  <strong>Deepfakes and impersonation:</strong> non-consensual synthetic media of
                  real people, content that impersonates individuals in a misleading or harmful way,
                  or deceptive content presented as authentic
                </li>
                <li>
                  <strong>Copyright or trademark infringement:</strong> content that infringes
                  others&rsquo; intellectual property, privacy, or publicity rights
                </li>
              </ul>
              <p className="text-gray-700 mb-4">You additionally agree not to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Generate otherwise illegal, harmful, or offensive content</li>
                <li>Create misleading or deceptive content</li>
                <li>Attempt to reverse engineer, circumvent safety filters, or misuse the service</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Enforcement Actions</h3>
              <p className="text-gray-700 mb-4">
                If we determine that you have violated this policy, we may take one or more of the
                following actions, depending on severity and frequency:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Removal or blocking of the violating content</li>
                <li>Warning notices to your account</li>
                <li>Temporary suspension of your account or generation features</li>
                <li>Permanent termination of your account without refund</li>
                <li>Reporting to law enforcement or other authorities where required by law</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Reporting Violations</h3>
              <p className="text-gray-700 mb-4">
                If you encounter content that you believe violates this policy, please report it to{' '}
                <a href="mailto:support@easynanobanana.com" className="text-yellow-600 hover:text-yellow-700 underline">
                  support@easynanobanana.com
                </a>{' '}
                with a link or screenshot of the content and a brief description of the issue. We
                review reports promptly and aim to respond within 72 hours. Reports may be submitted
                anonymously.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.4 Content Moderation</h3>
              <p className="text-gray-700 mb-4">
                We use a combination of automated and human moderation to enforce this policy:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  Automated safety filters screen prompts and generated outputs for prohibited
                  content before delivery
                </li>
                <li>Flagged content and user reports are reviewed by our moderation team</li>
                <li>
                  Repeat-violation tracking is applied at the account level and informs enforcement
                  decisions
                </li>
                <li>
                  You may appeal a moderation decision by contacting{' '}
                  <a href="mailto:support@easynanobanana.com" className="text-yellow-600 hover:text-yellow-700 underline">
                    support@easynanobanana.com
                  </a>{' '}
                  within 30 days of the action
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Content and Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                You retain ownership of any content you upload or create using our service. However, 
                by using our service, you grant us a limited license to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Process and store your content to provide the service</li>
                <li>Use generated content for service improvement (anonymized)</li>
                <li>Display your content as part of the service functionality</li>
              </ul>
              <p className="text-gray-700 mt-4">
                You are responsible for ensuring you have the right to use any content you upload.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payment and Credits</h2>
              <p className="text-gray-700 mb-4">
                Our service operates on a credit-based system. By purchasing credits or subscriptions:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>All payments are final and non-refundable unless required by law</li>
                <li>Credits do not expire unless specified otherwise</li>
                <li>Subscription fees are billed automatically</li>
                <li>We may change pricing with reasonable notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Service Availability</h2>
              <p className="text-gray-700">
                We strive to maintain service availability but do not guarantee uninterrupted access. 
                We may suspend or modify the service for maintenance, updates, or other operational reasons.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy</h2>
              <p className="text-gray-700">
                Your privacy is important to us. Please review our Privacy Policy to understand 
                how we collect, use, and protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700">
                To the maximum extent permitted by law, we shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, or any loss of profits 
                or revenues, whether incurred directly or indirectly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-700">
                We may terminate or suspend your account and access to the service at our sole 
                discretion, without prior notice, for conduct that we believe violates these terms 
                or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. We will notify users of 
                significant changes by posting the updated terms on our website and updating the 
                &ldquo;Last updated&rdquo; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-700">
                These terms shall be governed by and construed in accordance with applicable laws, 
                without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700">
                If you have any questions about these terms, please contact us at <a href="mailto:support@easynanobanana.com" className="text-yellow-600 hover:text-yellow-700 underline">support@easynanobanana.com</a> or 
                through our support channels.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}