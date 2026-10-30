import React from 'react';
import {
  FileText,
  Users,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sigma,
  GitBranch,
  FileCheck,
  Layers,
  Award,
  HardHat,
  Compass,
  Building2,
  Droplets,
  Truck,
  Activity,
} from 'lucide-react';

interface LandingPageProps {
  onOpenEditor: () => void;
  onOpenDashboard: () => void;
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenEditor,
  onOpenDashboard,
  onOpenLogin,
}) => {
  return (
    <div className="min-h-full bg-stone-50 text-stone-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">
                <HardHat className="w-3.5 h-3.5 text-indigo-600" />
                <span>Civil & Environmental Engineering Research Directorate</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight leading-[1.18] text-balance">
                Collaborative research platform for civil engineering and infrastructure.
              </h1>

              <p className="text-base sm:text-lg text-stone-600 font-serif leading-relaxed max-w-2xl">
                A unified academic workspace for civil engineers, structural analysts, and geotechnical researchers to document experimental testing, formulate mechanics models, and author peer-reviewed manuscripts.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={onOpenEditor}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <span>Open Engineering Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenDashboard}
                  className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm rounded-xl border border-stone-300/80 transition-colors cursor-pointer"
                >
                  View Research Manuscripts
                </button>
              </div>

              {/* Engineering Disciplines Strip */}
              <div className="pt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-500 font-medium">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Structural & seismic mechanics</span>
                </span>
                <span className="text-stone-300">·</span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Geotechnical & soil analysis</span>
                </span>
                <span className="text-stone-300">·</span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Materials, water & transit systems</span>
                </span>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-xl bg-stone-100 relative group">
                <img
                  src="/src/assets/images/research_hero_banner_1793246708956.jpg"
                  alt="Civil and Structural Engineering Research"
                  className="w-full h-[360px] object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent flex items-end p-5">
                  <div className="text-white">
                    <p className="text-xs font-mono uppercase tracking-wider text-indigo-200">
                      Infrastructure & Materials Laboratory
                    </p>
                    <p className="text-sm font-semibold mt-0.5">
                      Civil & Structural Engineering Research Directorate
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Highlights Strip */}
          <div className="mt-14 pt-8 border-t border-stone-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">ASCE & ACI</p>
              <p className="text-xs text-stone-500 font-medium mt-1">Standard structural design codes</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">Formulas</p>
              <p className="text-xs text-stone-500 font-medium mt-1">Mechanics & hydraulics notation</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">Peer Review</p>
              <p className="text-xs text-stone-500 font-medium mt-1">Tracked changes & co-authoring</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">Full Archive</p>
              <p className="text-xs text-stone-500 font-medium mt-1">Experimental data & revisions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Civil Engineering Research Pillars */}
      <section className="py-16 md:py-20 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              Tailored for civil engineering research tasks and laboratory workflows.
            </h2>
            <p className="text-sm sm:text-base text-stone-600 font-serif mt-2">
              From finite element modeling and soil compaction logs to hydraulic simulations and concrete compressive testing, the platform manages complete engineering research documentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Task 1: Structural & Seismic Engineering */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">Structural & Seismic Engineering</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-serif">
                Author papers on nonlinear seismic response, finite element beam-column joints, bridge dynamics, and reinforced concrete/steel design with embedded stress-strain diagrams.
              </p>
            </div>

            {/* Task 2: Geotechnical & Soil Mechanics */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">Geotechnical & Foundation Analysis</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-serif">
                Document borehole logs, Terzaghi effective stress formulations, Mohr-Coulomb shear failure criteria, slope stability simulations, and deep foundation pile load tests.
              </p>
            </div>

            {/* Task 3: Sustainable Construction Materials */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">Materials & Concrete Performance</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-serif">
                Tabulate mix designs, water-cement ratios, slump measurements, and 7/28-day compressive rupture tests with comparative performance curves across binder types.
              </p>
            </div>

            {/* Task 4: Water Resources & Hydraulic Engineering */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">Water Resources & Hydraulics</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-serif">
                Formulate open-channel Manning equations, Darcy-Weisbach head loss coefficients, groundwater seepage nets, storm drainage calculations, and hydrological models.
              </p>
            </div>

            {/* Task 5: Transportation & Highway Infrastructure */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">Transportation & Pavement Systems</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-serif">
                Evaluate asphalt fatigue cracking, flexible vs. rigid pavement durability, traffic volume capacity, and multi-modal transit network resiliency studies.
              </p>
            </div>

            {/* Task 6: Structural Health Monitoring & Management */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">Health Monitoring & Life-Cycle Assessment</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-serif">
                Analyze wireless strain sensor telemetry, vibration modal analysis for bridges and high-rises, and life-cycle carbon emissions for sustainable infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase Section */}
      <section className="py-16 md:py-20 bg-white border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <img
                src="/src/assets/images/academic_paper_preview_1793246709732.jpg"
                alt="Civil Engineering Journal Manuscript"
                className="rounded-2xl shadow-lg border border-stone-200 object-cover w-full h-[320px]"
              />
            </div>
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-semibold">
                Journal & Conference Compliance
              </span>
              <h3 className="text-2xl font-serif font-bold text-stone-900">
                Ready for ASCE, Elsevier, Springer, and ICE publications.
              </h3>
              <p className="text-sm text-stone-600 font-serif leading-relaxed">
                Whether submitting to the ASCE Journal of Structural Engineering, Geotechnique, Construction and Building Materials, or the Transportation Research Record, CivilLab formats dual-column layouts, figures, equation cross-references, and references automatically.
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenEditor}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                >
                  <span>Open active civil engineering workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Call to Action */}
      <section className="py-16 bg-stone-900 text-white border-t border-stone-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold">
            Begin authoring your next civil engineering research manuscript
          </h2>
          <p className="text-sm text-stone-400 font-serif max-w-xl mx-auto">
            Collaborate with your structural, geotechnical, and materials research colleagues in one unified engineering workspace.
          </p>
          <div className="flex justify-center items-center gap-3 pt-2">
            <button
              onClick={onOpenEditor}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Open Editor
            </button>
            <button
              onClick={onOpenLogin}
              className="px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl border border-stone-700 transition-colors cursor-pointer"
            >
              Sign In to Laboratory
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
