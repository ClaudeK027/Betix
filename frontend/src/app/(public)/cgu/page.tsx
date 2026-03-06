import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Conditions Générales d\'Utilisation | BETIX',
    description: 'Conditions Générales d\'Utilisation de la plateforme BETIX.',
};

export default function CGUPage() {
    return (
        <div className="min-h-screen bg-black pt-32 pb-20 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <div className="max-w-4xl mx-auto px-6 relative z-10">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        Conditions <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">d'Utilisation</span>
                    </h1>
                    <p className="text-neutral-400 text-lg">Dernière mise à jour : 1er Mars 2026</p>
                </div>

                <div className="space-y-12 text-neutral-300 leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-blue-500 font-mono text-lg">01.</span> Acceptation
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                            <p>
                                En accédant ou en utilisant la plateforme BETIX (ci-après "le Service"), vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le Service.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-blue-500 font-mono text-lg">02.</span> Description du Service
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                            <p className="mb-4">
                                BETIX est un outil d'assistance et d'analyse algorithmique basé sur l'Intelligence Artificielle destiné à l'analyse d'événements sportifs. Le Service fournit des statistiques, des modèles mathématiques, et des suggestions d'analyse.
                            </p>
                            <p className="font-bold text-red-400">
                                Attention : BETIX n'est pas un site de paris sportifs, de jeux d'argent, ou de bookmaker. BETIX ne garantit aucun gain financier.
                            </p>
                            <p className="mt-4">
                                Les paris sportifs comportent des risques (endettement, isolement, dépendance). Les analyses fournies sont à titre informatif et l'utilisateur reste seul responsable de ses prises de décision chez les opérateurs agréés.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-blue-500 font-mono text-lg">03.</span> Compte Utilisateur
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                            <p>
                                L'accès à certaines fonctionnalités nécessite la création d'un compte. Vous êtes responsable du maintien de la confidentialité de vos identifiants de connexion et de toutes les activités qui se produisent sous votre compte. Le service est strictement réservé aux personnes majeures (+18 ans).
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-blue-500 font-mono text-lg">04.</span> Limitation de Responsabilité
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                            <p>
                                Dans toute la mesure permise par la loi applicable, BETIX et ses créateurs ne sauraient être tenus responsables des pertes financières directes ou indirectes découlant de l'utilisation ou de l'incapacité d'utiliser les données fournies par nos algorithmes.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-blue-500 font-mono text-lg">05.</span> Propriété Intellectuelle
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                            <p>
                                Tous les contenus, algorithmes, marques et éléments visuels présents sur BETIX sont la propriété exclusive de BETIX. Toute reproduction totale ou partielle, représentation, modification ou utilisation sans autorisation préalable est strictement interdite.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-blue-500 font-mono text-lg">06.</span> Contact
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                            <p>
                                Pour toute question concernant ces Conditions Générales, veuillez nous contacter via notre interface de support sur la plateforme.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
