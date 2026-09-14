export interface Trend {
  value: number;
  percentChange: number;
  direction: 'Up' | 'Down' | 'Flat';
}

/**
 * Évolution d'un compteur entre les 30 derniers jours et les 30 jours précédents.
 * Même logique que MetricTrend.Compute côté WPF : jamais une valeur inventée, toujours
 * calculée à partir des dates réelles des devis/factures.
 */
export function computeTrend(currentPeriod: number, previousPeriod: number, totalValue: number): Trend {
  if (previousPeriod === 0) {
    return { value: totalValue, percentChange: currentPeriod > 0 ? 100 : 0, direction: currentPeriod > 0 ? 'Up' : 'Flat' };
  }
  const change = Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100);
  const direction: Trend['direction'] = change > 0 ? 'Up' : change < 0 ? 'Down' : 'Flat';
  return { value: totalValue, percentChange: Math.abs(change), direction };
}
