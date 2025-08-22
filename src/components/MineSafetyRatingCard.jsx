import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { format, parseISO, differenceInDays } from 'date-fns';

const INCIDENT_TYPE_ORDER = [
  'Near Miss',
  'High Potential Incident',
  'Non-Serious LTI (Non-Reportable)',
  'Non-Serious LTI (Reportable, >48h absence)',
  'Serious Bodily Injury',
  'Fatal Injury',
];

const getIncidentPoints = (type) => {
  switch (type) {
    case 'Near Miss': return 5;
    case 'High Potential Incident': return -5;
    case 'Non-Serious LTI (Non-Reportable)': return -5;
    case 'Non-Serious LTI (Reportable, >48h absence)': return -10;
    case 'Serious Bodily Injury': return -20;
    case 'Fatal Injury': return -100;
    default: return 0;
  }
};

const getClosurePoints = (type, closureDays) => {
  const benchmarks = {
    'Near Miss': { time: 7, bonus: 2, penalty: -5 },
    'High Potential Incident': { time: 14, bonus: 5, penalty: -7 },
    'Non-Serious LTI (Non-Reportable)': { time: 14, bonus: 5, penalty: -7 },
    'Non-Serious LTI (Reportable, >48h absence)': { time: 21, bonus: 10, penalty: -10 },
    'Serious Bodily Injury': { time: 30, bonus: 15, penalty: -15 },
    'Fatal Injury': { time: 45, bonus: 20, penalty: -20 },
  };
  const bm = benchmarks[type];
  if (!bm) return 0;
  return closureDays <= bm.time ? bm.bonus : bm.penalty;
};

const MineSafetyRatingCard = () => {
  const { incidents, currentDate, loading: appLoading } = useContext(AppContext);
  const { MINES } = useContext(ConfigContext);
  const [flippedCards, setFlippedCards] = useState({});

  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleFlip = (mine) => {
    setFlippedCards(prev => ({ ...prev, [mine]: !prev[mine] }));
  };

  const mineSafetyScores = useMemo(() => {
    if (appLoading || !incidents || !MINES?.length || !currentDate) return [];

    const monthlyIncidents = incidents.filter((inc) => {
      const incDate = parseISO(inc.date);
      return (
        incDate.getMonth() === currentDate.getMonth() &&
        incDate.getFullYear() === currentDate.getFullYear()
      );
    });

    const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    const incidentFreeDays = MINES.reduce((acc, mine) => {
      const datesWithIncidents = new Set(
        monthlyIncidents.filter(inc => inc.mine === mine).map(inc => inc.date)
      );
      acc[mine] = totalDays - datesWithIncidents.size;
      return acc;
    }, {});

    const rawScores = MINES.map(mine => {
      const mineIncidents = monthlyIncidents.filter(inc => inc.mine === mine);
      let score = incidentFreeDays[mine] * 2;
      let breakdown = {};
      INCIDENT_TYPE_ORDER.forEach(type => {
        breakdown[type] = 0;
      });
      breakdown['Incident-Free Days'] = incidentFreeDays[mine] * 2;
      breakdown['Closure Bonuses'] = 0;
      breakdown['Closure Penalties'] = 0;

      mineIncidents.forEach(inc => {
        if (breakdown[inc.type] === undefined) breakdown[inc.type] = 0;
        const incidentPts = getIncidentPoints(inc.type);
        breakdown[inc.type] += incidentPts;
        score += incidentPts;

        if (inc.status === 'Closed' && inc.closureDate) {
          const closureDays = differenceInDays(parseISO(inc.closureDate), parseISO(inc.date));
          const closurePts = getClosurePoints(inc.type, closureDays);
          score += closurePts;
          if (closurePts > 0) breakdown['Closure Bonuses'] += closurePts;
          else breakdown['Closure Penalties'] += closurePts;
        }
      });

      return {
        mine,
        rawScore: score,
        incidentFreeDays: incidentFreeDays[mine],
        breakdown,
      };
    });

    const highestScore = Math.max(...rawScores.map(m => m.rawScore), 1);

    return rawScores.map(m => ({
      ...m,
      normalizedScore: highestScore > 0 ? (m.rawScore / highestScore) * 100 : 0
    })).sort((a, b) => b.normalizedScore - a.normalizedScore);

  }, [incidents, MINES, currentDate, appLoading]);

  const bestPerformingMine = mineSafetyScores[0] ?? null;
  const worstPerformingMine = mineSafetyScores.length > 1 ? mineSafetyScores[mineSafetyScores.length - 1] : null;

  const getAllOtherMines = () => {
    let others = [...mineSafetyScores];
    if (bestPerformingMine) others = others.filter(m => m.mine !== bestPerformingMine.mine);
    if (worstPerformingMine && worstPerformingMine.mine !== (bestPerformingMine && bestPerformingMine.mine)) {
      others = others.filter(m => m.mine !== worstPerformingMine.mine);
    }
    return others;
  };

  const orderedMines = [
    ...(bestPerformingMine ? [bestPerformingMine] : []),
    ...(worstPerformingMine && (!bestPerformingMine || worstPerformingMine.mine !== bestPerformingMine.mine)
      ? [worstPerformingMine]
      : []),
    ...getAllOtherMines(),
  ];

  // Scroll handlers for touch and mouse drag
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    };

    const onTouchStart = (e) => {
      isDragging.current = true;
      startX.current = e.touches[0].pageX - container.offsetLeft;
      scrollLeft.current = container.scrollLeft;
    };

    const onTouchMove = (e) => {
      if (!isDragging.current) return;
      const x = e.touches.pageX - container.offsetLeft;
      const walk = (startX.current - x);
      container.scrollLeft = scrollLeft.current + walk;
    };

    const onTouchEnd = () => {
      isDragging.current = false;
    };

    const onMouseDown = (e) => {
      isDragging.current = true;
      startX.current = e.pageX - container.offsetLeft;
      scrollLeft.current = container.scrollLeft;
    };

    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (startX.current - x);
      container.scrollLeft = scrollLeft.current + walk;
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
    };
  }, []);

  return (
    <section className="p-4">
      <h2 className="text-lg font-normal mb-4">Mine Safety Ratings</h2>
      <div
        ref={containerRef}
        className="flex space-x-6 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400 -mx-4 px-4"
        style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
      >
        {orderedMines.length === 0 ? (
          <div className="text-gray-500">No safety ratings to display for this period.</div>
        ) : (
          orderedMines.map(({ mine, normalizedScore, incidentFreeDays, breakdown }) => {
            const isFlipped = flippedCards[mine];
            const isBest = bestPerformingMine && mine === bestPerformingMine.mine;
            const isWorst = worstPerformingMine && mine === worstPerformingMine.mine;

            const cardScaleClass = isBest || isWorst ? 'scale-105' : '';
            const emoji = isBest ? '💎🏆' : isWorst ? '👎😞' : null;

            return (
              <div
                key={mine}
                onClick={() => handleFlip(mine)}
                className={`cursor-pointer select-none snap-start bg-white rounded-md shadow-sm border border-gray-200 p-4 text-gray-700 transition-transform duration-300 transform ${cardScaleClass}`}
                style={{ scrollSnapAlign: 'start', minWidth: '16rem' }}
              >
                {!isFlipped ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-normal">{mine}</h3>
                      {emoji && (
                        <span className="text-xl select-none" role="img" aria-label={emoji === '🎉' ? 'happy' : 'sad'}>
                          {emoji}
                        </span>
                      )}
                    </div>
                    <div className="text-3xl font-semibold mb-1">{normalizedScore.toFixed(1)}</div>
                    <div className="text-sm text-gray-500">
                      {incidentFreeDays} Incident-Free Days
                    </div>
                    <div className="mt-3 text-xs text-gray-400 italic">
                      Click card to see detailed breakdown
                    </div>
                  </>
                ) : (
                  <div className="text-sm space-y-1 min-h-[120px] text-gray-700">
                    <h4 className="font-semibold mb-2">{mine} - Incident Breakdown</h4>
                    {Object.entries(breakdown).map(([type, value]) => (
                      <div key={type} className="flex justify-between">
                        <span>{type}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                    <div className="mt-2 text-xs text-gray-400 italic">
                      Click card to flip back
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default MineSafetyRatingCard;
