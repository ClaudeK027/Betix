import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Politique de Confidentialité | BETIX',
    description: 'Politique de Confidentialité et gestion de la vie privée sur BETIX.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black pt-32 pb-20 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <div className="max-w-4xl mx-auto px-6 relative z-10">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        Politique de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Confidentialité</span>
                    </h1>
                    <p className="text-neutral-400 text-lg">Dernière mise à jour : 1er Mars 2026</p>
                </div>

                <div className="space-y-12 text-neutral-300 leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-purple-500 font-mono text-lg">01.</span> Collecte des données
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                            <p className="mb-4">
                                Chez BETIX, nous accordons une importance primordiale à la protection de vos données personnelles. Les données que nous collectons incluent :
                            </p>
                            <ul className="list-disc leading-relaxed mt-2 space-y-2 list-inside text-neutral-400">
                                <li>Informations de compte : adresse e-mail, nom d'utilisateur (si applicable).</li>
                                <li>Données de connexion et d'activité pour sécuriser votre compte.</li>
                                <li>Préférences utilisateur (sports suivis, réglages interface).</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-purple-500 font-mono text-lg">02.</span> Utilisation de vos informations
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                            <p>
                                Vos données sont exploitées uniquement pour :
                            </p>
                            <ul className="list-disc leading-relaxed mt-4 space-y-2 list-inside text-neutral-400">
                                <li>Vous fournir nos services d'analyses personnalisées et l'accès à nos modèles d'IA.</li>
                                <li>Assurer la sécurité, empêcher la fraude, et authentifier vos sessions de manière chiffrée.</li>
                                <li>Communiquer avec vous concernant des mises à jour majeures du système ou répondre à vos demandes de support.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-purple-500 font-mono text-lg">03.</span> Partage des Données
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                            <p>
                                <strong className="text-white">Nous ne vendons, n'échangeons, ni ne louons vos informations personnelles à des tiers.</strong><br /><br />
                                Nous pouvons être amenés à partager des informations de facturation limitées avec notre processeur de paiement sécurisé (Stripe) afin de gérer vos abonnements, strictement dans le cadre imposé par la réglementation financière et européenne (RGPD).
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-purple-500 font-mono text-lg">04.</span> Sécurité des Données
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                            <p>
                                Vos données sont stockées chez notre fournisseur d'infrastructure cloud hautement sécurisé (Supabase). L'accès et la transmission sont protégés par le protocole AES-256 via HTTPS/TLS pour garantir l'intégrité et la confidentialité.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-purple-500 font-mono text-lg">05.</span> Vos Droits (RGPD)
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                            <p>
                                Conformément à la réglementation RGPD européenne, vous disposez des droits suivants concernant vos informations :
                            </p>
                            <ul className="list-disc leading-relaxed mt-4 space-y-2 list-inside text-neutral-400">
                                <li>Droit d'accès et d'information.</li>
                                <li>Droit de rectification de vos données.</li>
                                <li>Droit d'effacement ("Droit à l'oubli").</li>
                                <li>Droit à la limitation et à la portabilité.</li>
                            </ul>
                            <p className="mt-4">
                                Pour exercer l'un de ces droits, contactez notre équipe support qui traitera votre demande dans les délais légaux.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
