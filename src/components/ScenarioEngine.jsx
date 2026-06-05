import { useState, useEffect } from 'react';
import Slider from './UI/Slider';
import Button from './UI/Button';
import Badge from './UI/Badge';
import { SCENARIO_PRESETS, REGION_PRESETS } from '../constants/ideas';
import { Settings2, MapPin } from 'lucide-react';

const REGIONS = Object.keys(REGION_PRESETS);

export default function ScenarioEngine({ onScenarioChange, loading }) {
  const [scenario, setScenario] = useState({
    economicConditions: 50,
    mentalHealthIndex: 50,
    socialTrendIntensity: 50,
    productivityCulture: 50,
    socialFragmentation: 50,
    region: 'Global',
  });

  useEffect(() => {
    onScenarioChange(scenario);
  }, [scenario, onScenarioChange]);

  const handleSliderChange = (key, value) => {
    setScenario((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset) => {
    setScenario(SCENARIO_PRESETS[preset]);
  };

  const handleRegionChange = (region) => {
    const preset = REGION_PRESETS[region];
    setScenario({
      economicConditions:   preset.economicConditions,
      mentalHealthIndex:    preset.mentalHealthIndex,
      socialTrendIntensity: preset.socialTrendIntensity,
      productivityCulture:  preset.productivityCulture,
      socialFragmentation:  preset.socialFragmentation,
      region,
    });
  };

  const avg = (
    scenario.economicConditions +
    scenario.mentalHealthIndex +
    scenario.socialTrendIntensity +
    (scenario.productivityCulture || 50) +
    (scenario.socialFragmentation || 50)
  ) / 5;

  const health = avg >= 70
    ? { label: 'Optimal', variant: 'success' }
    : avg >= 50
    ? { label: 'Moderate', variant: 'warning' }
    : { label: 'Challenging', variant: 'danger' };

  const regionInfo = REGION_PRESETS[scenario.region];

  return (
    <div className="glass-card p-5 space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(6,182,212,0.15)' }}>
            <Settings2 size={16} className="text-cyan-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">World Conditions</h3>
        </div>
        <Badge label={health.label} variant={health.variant} size="sm" />
      </div>

      {/* Region Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <MapPin size={12} className="text-violet-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Region (Auto-Adjust)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => handleRegionChange(r)}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
              style={{
                background: scenario.region === r
                  ? 'rgba(124,58,237,0.25)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${scenario.region === r ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: scenario.region === r ? '#a78bfa' : '#64748b',
              }}
            >
              {r}
            </button>
          ))}
        </div>
        {regionInfo?.description && (
          <p className="text-[10px] text-slate-500 italic leading-relaxed">{regionInfo.description}</p>
        )}
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-3">
        <div className="flex-1 progress-bar">
          <div className="progress-fill transition-all duration-500" style={{ width: `${avg}%` }} />
        </div>
        <span className="text-xs font-bold text-slate-400 tabular-nums w-8 text-right">{Math.round(avg)}</span>
      </div>

      <div className="space-y-5">
        <Slider
          label="Global Economy"
          value={scenario.economicConditions}
          onChange={(v) => handleSliderChange('economicConditions', v)}
        />
        <Slider
          label="Global Mental Health"
          value={scenario.mentalHealthIndex}
          onChange={(v) => handleSliderChange('mentalHealthIndex', v)}
        />
        <Slider
          label="Social Media Influence"
          value={scenario.socialTrendIntensity}
          onChange={(v) => handleSliderChange('socialTrendIntensity', v)}
        />
        <Slider
          label="Hustle Culture"
          value={scenario.productivityCulture || 50}
          onChange={(v) => handleSliderChange('productivityCulture', v)}
        />
        <Slider
          label="Social Divide"
          value={scenario.socialFragmentation || 50}
          onChange={(v) => handleSliderChange('socialFragmentation', v)}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { key: 'optimistic', label: 'Easy' },
          { key: 'neutral', label: 'Moderate' },
          { key: 'pessimistic', label: 'Hard' }
        ].map((preset) => (
          <Button
            key={preset.key}
            variant="secondary"
            size="sm"
            onClick={() => applyPreset(preset.key)}
            disabled={loading}
            className="capitalize text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
