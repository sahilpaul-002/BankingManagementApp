import { Link } from 'react-router-dom';

const lastUpdated = 'October 14, 2026';

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
                <header className="mb-10 border-b border-border pb-6">
                    <Link
                        to="/"
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        ← Banking Management
                    </Link>

                    <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                        Privacy Policy
                    </h1>

                    <p className="mt-3 text-sm text-muted-foreground">
                        Last updated: {lastUpdated}
                    </p>

                    <p className="mt-5 leading-7 text-muted-foreground">
                        This Privacy Policy explains how Banking Management
                        Application handles information when you use our
                        application and its demonstration banking features.
                    </p>
                </header>

                <article className="space-y-9 leading-7">
                    <section>
                        <h2 className="mb-3 text-xl font-semibold">
                            1. About this application
                        </h2>
                        <p>
                            Banking Management Application is a software
                            demonstration project designed to showcase
                            digital banking workflows and related features.
                            It is not a bank, financial institution, or
                            provider of regulated financial services.
                        </p>
                        <p className="mt-3">
                            Please do not submit real banking passwords,
                            payment card security codes, or other sensitive
                            financial information that is not necessary for
                            testing the demonstration.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold">
                            2. Information we may collect
                        </h2>
                        <p>
                            Depending on the features you use, the
                            application may process:
                        </p>
                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>
                                Account information, such as your name,
                                email address, and account identifiers.
                            </li>
                            <li>
                                Verification information and documents
                                submitted through demonstration KYC or KYB
                                workflows.
                            </li>
                            <li>
                                Demonstration wallet, card, beneficiary,
                                payout, and transaction records.
                            </li>
                            <li>
                                Authentication information, including
                                one-time verification codes and related
                                account security events.
                            </li>
                            <li>
                                Technical information needed to operate,
                                secure, troubleshoot, and maintain the
                                application.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold">
                            3. How we use information
                        </h2>
                        <p>
                            Information may be used to create and manage
                            demo accounts, operate application features,
                            perform verification workflows, send
                            authentication and service emails, maintain
                            security, troubleshoot errors, and improve the
                            demonstration.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold">
                            4. Email delivery and Google API services
                        </h2>
                        <p>
                            The application may use the Gmail API to send
                            transactional emails, such as one-time
                            verification codes and account-related
                            notifications, from a configured sender
                            account to the email address associated with
                            the requested action.
                        </p>
                        <p className="mt-3">
                            For this purpose, the application uses the
                            authorization granted by the configured Gmail
                            account to send messages. The application does
                            not need to read the sender&apos;s inbox to
                            perform this email-sending function.
                        </p>
                        <p className="mt-3">
                            Google API data is used only for the disclosed
                            functionality and is not sold. Access tokens
                            and refresh tokens should be stored securely
                            in server-side environment variables and must
                            not be exposed to frontend code or other users.
                        </p>
                        <p className="mt-3">
                            The app&apos;s use and transfer to any other
                            app of information received from Google APIs
                            will adhere to the{' '}
                            <a
                                href="https://developers.google.com/terms/api-services-user-data-policy"
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4"
                            >
                                Google API Services User Data Policy
                            </a>
                            , including the Limited Use requirements.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold">
                            5. Storage and service providers
                        </h2>
                        <p>
                            Information may be processed or stored by the
                            infrastructure and service providers used to
                            operate the application, such as application
                            hosting, databases, file storage, and email
                            delivery services. These providers may process
                            information as needed to provide their
                            services.
                        </p>
                        <p className="mt-3">
                            We take reasonable steps appropriate to this
                            demonstration project to protect information.
                            However, no application or method of electronic
                            storage can be guaranteed to be completely
                            secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold">
                            6. Sharing of information
                        </h2>
                        <p>
                            We do not sell personal information. Information
                            may be processed by service providers supporting
                            the application, or disclosed when required by
                            applicable law or when necessary to protect the
                            application and its users.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold">
                            7. Data retention and deletion
                        </h2>
                        <p>
                            Information may be retained for as long as
                            needed to operate the demonstration, maintain
                            records, resolve technical issues, or meet
                            applicable legal obligations. Retention periods
                            can depend on the data type and the service
                            storing it.
                        </p>
                        <p className="mt-3">
                            To ask about access to or deletion of information
                            associated with your demo account, contact us
                            using the email address below.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold">
                            8. Children&apos;s privacy
                        </h2>
                        <p>
                            This application is a general-purpose software
                            demonstration and is not intended to collect
                            personal information from children.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold">
                            9. Changes to this policy
                        </h2>
                        <p>
                            This policy may be updated when the
                            application&apos;s functionality or data
                            practices change. The latest version and its
                            update date will be published on this page.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-xl font-semibold">
                            10. Contact
                        </h2>
                        <p>
                            For privacy-related questions about this
                            demonstration application, contact:
                        </p>
                        <p className="mt-3">
                            <a
                                href="mailto:nodemailtesting02@gmail.com"
                                className="underline underline-offset-4"
                            >
                                nodemailtesting02@gmail.com
                            </a>
                        </p>
                    </section>
                </article>

                <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
                    <Link
                        to="/"
                        className="underline underline-offset-4 hover:text-foreground"
                    >
                        Return to the application
                    </Link>
                </footer>
            </div>
        </main>
    );
}