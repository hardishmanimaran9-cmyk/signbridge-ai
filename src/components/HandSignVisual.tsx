import React, { useState } from 'react';
import { getSignByLabel } from '../data/vocabulary';
import { ZoomIn, X, CheckCircle, ExternalLink } from 'lucide-react';

interface HandSignVisualProps {
  label: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showCaption?: boolean;
  interactive?: boolean;
}

// Map label to authentic human demonstrator photo file in /signs/real/
const REAL_SIGN_IMAGES: Record<string, string> = {
  // Core vocabulary
  NAMASTE: '/signs/real/hello.png',
  HELLO: '/signs/real/hello.png',
  WATER: '/signs/real/water.png',
  FOOD: '/signs/real/food.png',
  HUNGRY: '/signs/real/food.png',
  YES: '/signs/real/yes.png',
  NO: '/signs/real/no.png',
  PLEASE: '/signs/real/please.png',
  THANK_YOU: '/signs/real/thank_you.png',
  'THANK YOU': '/signs/real/thank_you.png',
  THANKS: '/signs/real/thank_you.png',
  SORRY: '/signs/real/sorry.png',
  GOOD: '/signs/real/good.png',
  BAD: '/signs/real/bad.png',
  HELP: '/signs/real/help.png',
  STOP: '/signs/real/stop.png',
  RESTROOM: '/signs/real/toilet.png',
  TOILET: '/signs/real/toilet.png',
  OK: '/signs/real/ok.png',
  'PEACE / VICTORY': '/signs/real/peace.png',
  PEACE: '/signs/real/peace.png',
  VICTORY: '/signs/real/peace.png',
  CALL: '/signs/real/call.png',
  PHONE: '/signs/real/call.png',
  I_LOVE_YOU: '/signs/real/i_love_you.png',
  'I LOVE YOU': '/signs/real/i_love_you.png',
  LOVE: '/signs/real/i_love_you.png',
  FRIEND: '/signs/real/friend.png',
  I_ME: '/signs/real/i_me.png',
  I: '/signs/real/i_me.png',
  ME: '/signs/real/i_me.png',

  // Everyday needs & actions
  EAT: '/signs/real/eat.png',
  DRINK: '/signs/real/drink.png',
  SLEEP: '/signs/real/sleep.png',
  HOUSE: '/signs/real/house.png',
  HOME: '/signs/real/house.png',
  SCHOOL: '/signs/real/school.png',
  COME: '/signs/real/come.png',
  GO: '/signs/real/go.png',

  // Useful phrases
  HOW_ARE_YOU: '/signs/real/how_are_you.png',
  'HOW ARE YOU': '/signs/real/how_are_you.png',
  I_AM_FINE: '/signs/real/i_am_fine.png',
  'I AM FINE': '/signs/real/i_am_fine.png',
  WHAT_IS_YOUR_NAME: '/signs/real/what_is_your_name.png',
  'WHAT IS YOUR NAME': '/signs/real/what_is_your_name.png',
  MY_NAME_IS: '/signs/real/my_name_is.png',
  'MY NAME IS': '/signs/real/my_name_is.png',
  WHERE: '/signs/real/where.png',
  WHEN: '/signs/real/when.png',
  WHY: '/signs/real/why.png',
  BECAUSE: '/signs/real/because.png',

  // Numbers (0-10)
  NUM_0: '/signs/real/num_0.png',
  '0': '/signs/real/num_0.png',
  NUM_1: '/signs/real/num_1.png',
  '1': '/signs/real/num_1.png',
  NUM_2: '/signs/real/num_2.png',
  '2': '/signs/real/num_2.png',
  NUM_3: '/signs/real/num_3.png',
  '3': '/signs/real/num_3.png',
  NUM_4: '/signs/real/num_4.png',
  '4': '/signs/real/num_4.png',
  NUM_5: '/signs/real/num_5.png',
  '5': '/signs/real/num_5.png',
  NUM_6: '/signs/real/num_6.png',
  '6': '/signs/real/num_6.png',
  NUM_7: '/signs/real/num_7.png',
  '7': '/signs/real/num_7.png',
  NUM_8: '/signs/real/num_8.png',
  '8': '/signs/real/num_8.png',
  NUM_9: '/signs/real/num_9.png',
  '9': '/signs/real/num_9.png',
  NUM_10: '/signs/real/num_10.png',
  '10': '/signs/real/num_10.png',

  // Alphabet (A-Z)
  A: '/signs/real/letter_a.png',
  B: '/signs/real/letter_b.png',
  C: '/signs/real/letter_c.png',
  D: '/signs/real/letter_d.png',
  E: '/signs/real/letter_e.png',
  F: '/signs/real/letter_f.png',
  G: '/signs/real/letter_g.png',
  H: '/signs/real/letter_h.png',
  I_LETTER: '/signs/real/letter_i.png',
  J: '/signs/real/letter_j.png',
  K: '/signs/real/letter_k.png',
  L: '/signs/real/letter_l.png',
  M: '/signs/real/letter_m.png',
  N: '/signs/real/letter_n.png',
  O: '/signs/real/letter_o.png',
  P: '/signs/real/letter_p.png',
  Q: '/signs/real/letter_q.png',
  R: '/signs/real/letter_r.png',
  S: '/signs/real/letter_s.png',
  T: '/signs/real/letter_t.png',
  U: '/signs/real/letter_u.png',
  V: '/signs/real/letter_v.png',
  W: '/signs/real/letter_w.png',
  X: '/signs/real/letter_x.png',
  Y: '/signs/real/letter_y.png',
  Z: '/signs/real/letter_z.png'
};

export const HandSignVisual: React.FC<HandSignVisualProps> = ({
  label,
  size = 'md',
  className = '',
  showCaption = false,
  interactive = false
}) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const cleanLabel = (label || '').toUpperCase().trim();
  const imgSrc = REAL_SIGN_IMAGES[cleanLabel] || '/signs/real/hello.png';
  const signInfo = getSignByLabel(cleanLabel);

  // Dimension presets (width x height) preserving 3:4 portrait ratio of real photo cells
  const dimensions = {
    sm: 'w-20 h-24',
    md: 'w-28 h-32',
    lg: 'w-40 h-48',
    xl: 'w-56 h-64'
  }[size];

  return (
    <>
      <div className={`relative inline-flex flex-col items-center group ${className}`}>
        {/* Real human demonstrator photo container */}
        <div
          onClick={(e) => {
            if (interactive) {
              e.stopPropagation();
              setIsZoomOpen(true);
            }
          }}
          className={`${dimensions} bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-2xs flex items-center justify-center transition-all ${
            interactive ? 'cursor-zoom-in hover:border-[#1E3A8A] hover:shadow-sm' : ''
          }`}
          title={signInfo?.description || `Real ISL demonstrator: ${cleanLabel}`}
        >
          {!imgError ? (
            <img
              src={imgSrc}
              alt={`Real Indian Sign Language demonstration for ${cleanLabel}`}
              className="w-full h-full object-contain object-center transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-50 text-slate-400">
              <span className="text-[10px] font-bold">{cleanLabel}</span>
            </div>
          )}

          {/* Real Human Sign Watermark Badge in large or hover view */}
          {size !== 'sm' && (
            <div className="absolute bottom-1 right-1 bg-white/95 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-700 border border-slate-200/90 shadow-2xs pointer-events-none">
              Real ISL
            </div>
          )}

          {/* Quick zoom hint icon if interactive */}
          {interactive && (
            <div className="absolute top-1 right-1 bg-white/90 rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 shadow-xs">
              <ZoomIn className="w-3 h-3" />
            </div>
          )}
        </div>

        {showCaption && (
          <span className="mt-1 text-[11px] font-bold text-slate-800 uppercase tracking-wide">
            {cleanLabel.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* High-Resolution Zoom Modal */}
      {isZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Authentic ISL Demonstration
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {cleanLabel.replace(/_/g, ' ')}
                </h3>
              </div>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center p-2 max-h-72">
              <img
                src={imgSrc}
                alt={`Real sign demonstration for ${cleanLabel}`}
                className="max-h-64 object-contain rounded-lg"
              />
            </div>

            {/* Translation and Details */}
            {signInfo && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block">English Meaning</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {signInfo.englishMessage}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tamil (தமிழ்)</span>
                    <span className="font-bold text-[#1E3A8A] text-sm">
                      {signInfo.tamilMessage}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800 block mb-0.5">How to Form Sign:</span>
                  {signInfo.description}
                </div>

                <div className="text-[11px] text-slate-500 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/60 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Landmark Alignment Cue: </span>
                    {signInfo.keyLandmarkCues}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsZoomOpen(false)}
              className="w-full py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
