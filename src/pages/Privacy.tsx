import Layout from "@/components/Layout";

const Privacy = () => {
  return (
    <Layout>
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="font-medium text-foreground mb-8">
              <strong>Effective Date:</strong> March 8, 2026
            </p>

            <p className="mb-8">
              This Privacy Policy explains how <strong>Integrity Realty STL, a DBA of Bahr Family Homes LLC</strong> ("we," "us," or "our") collects, uses, discloses, and protects information when you use our website, application, and related services.
            </p>

            <h2 className="font-serif text-2xl text-foreground mt-8 mb-4">1. Information We Collect</h2>
            <p className="mb-4">We may collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Mailing address</li>
              <li>Property-related information</li>
              <li>Offer and transaction information</li>
              <li>Account login and profile information</li>
              <li>Documents and other materials you choose to upload or submit through the platform</li>
            </ul>

            <p className="mb-4">We may also collect certain technical and usage information automatically, including:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>IP address</li>
              <li>Browser type</li>
              <li>Device type</li>
              <li>Operating system</li>
              <li>Referral URLs</li>
              <li>Pages viewed</li>
              <li>Dates and times of access</li>
              <li>General usage and interaction data</li>
            </ul>

            <h2 className="font-serif text-2xl text-foreground mt-8 mb-4">2. How We Use Information</h2>
            <p className="mb-4">We may use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Provide, operate, and maintain our website and services</li>
              <li>Create and manage user accounts</li>
              <li>Communicate with you about inquiries, offers, transactions, and support requests</li>
              <li>Facilitate real estate workflows, document processing, and transaction coordination</li>
              <li>Improve our platform, services, and user experience</li>
              <li>Monitor usage, troubleshoot issues, and maintain security</li>
              <li>Detect, prevent, and address fraud, abuse, or unauthorized activity</li>
              <li>Comply with legal obligations and enforce our terms</li>
            </ul>

            <h2 className="font-serif text-2xl text-foreground mt-8 mb-4">3. How We Share Information</h2>
            <p className="mb-4">We may share information in the following circumstances:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>With service providers and vendors who help us operate our business and platform</li>
              <li>With transaction participants or authorized users as needed to support real estate workflows</li>
              <li>With third-party integrations you choose to connect or use</li>
              <li>When required by law, regulation, subpoena, or legal process</li>
              <li>To protect our rights, property, safety, or the rights and safety of others</li>
              <li>In connection with a business transfer, merger, sale, or reorganization</li>
            </ul>
            <p className="mb-6 font-medium text-foreground">We do not sell your personal information.</p>

            <h2 className="font-serif text-2xl text-foreground mt-8 mb-4">4. Third-Party Services and Integrations</h2>
            <p className="mb-4">
              We may use third-party platforms, tools, and service providers to support our services. These may include hosting, database, authentication, analytics, communications, e-signature, and transaction management providers.
            </p>
            <p className="mb-6">
              For example, our platform may use or integrate with services such as <strong>Supabase</strong> and <strong>Dotloop</strong>. Information processed by those services may be subject to their own terms and privacy practices.
            </p>

            <h2 className="font-serif text-2xl text-foreground mt-8 mb-4">5. Cookies and Similar Technologies</h2>
            <p className="mb-4">We may use cookies, local storage, and similar technologies to:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Keep users signed in</li>
              <li>Remember preferences</li>
              <li>Improve functionality</li>
              <li>Analyze traffic and usage</li>
              <li>Support security and performance</li>
            </ul>
            <p className="mb-6">
              You can usually control cookies through your browser settings, though disabling some cookies may affect site functionality.
            </p>

            <h2 className="font-serif text-2xl text-foreground mt-8 mb-4">6. Data Retention</h2>
            <p className="mb-6">
              We retain information for as long as reasonably necessary to provide our services, fulfill transaction-related purposes, comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>

            <h2 className="font-serif text-2xl text-foreground mt-8 mb-4">7. Data Security</h2>
            <p className="mb-6">
              We take reasonable administrative, technical, and organizational measures to protect personal information. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="font-serif text-2xl text-foreground mt-8 mb-4">8. Your Choices and Rights</h2>
            <p className="mb-4">
              Depending on your location and applicable law, you may have the right to request access to, correction of, or deletion of certain personal information we hold about you.
            </p>
            <p className="mb-6">
              You may also contact us to update account information or ask questions about how your information is used.
            </p>

            <h2 className="font-serif text-2xl text-foreground mt-8 mb-4">9. Children's Privacy</h2>
            <p className="mb-6">
              Our website and services are not directed to children under the age of 13, and we do not knowingly collect personal information from children.
            </p>

            <h2 className="font-serif text-2xl text-foreground mt-8 mb-4">10. Third-Party Links</h2>
            <p className="mb-6">
              Our website or application may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties.
            </p>

            <h2 className="font-serif text-2xl text-foreground mt-8 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="mb-6">
              We may update this Privacy Policy from time to time. When we do, we will post the updated version on this page and revise the Effective Date above. Your continued use of the services after changes are posted constitutes acceptance of the updated policy.
            </p>

            <h2 className="font-serif text-2xl text-foreground mt-8 mb-4">12. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy or our data practices, you may contact us at:
            </p>
            <div className="bg-muted/50 p-6 rounded-lg mb-6 border border-border">
              <p className="mb-2"><strong>Integrity Realty STL, a DBA of Bahr Family Homes LLC</strong></p>
              <p className="mb-2">Email: jen@integrityrealtystl.com</p>
              <p>Website: https://integrityrealtystl.lovable.app</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
