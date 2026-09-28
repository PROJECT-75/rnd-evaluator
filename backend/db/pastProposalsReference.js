/**
 * Reference set of past/existing coal-sector R&D project topics, used to give
 * the LLM something concrete to judge novelty against.
 *
 * IMPORTANT: these are ILLUSTRATIVE topics written for the demo — they are NOT
 * NaCCER's actual funded-project records. A real deployment would load this from
 * NaCCER's project database. Say so if judges ask.
 *
 * Exported as a flat array of titles (what the LLM and keyword check use), with
 * the category grouping attached as `.groups` for the Reference Database tab.
 */
const GROUPS = {
  'Safety & monitoring': [
    'Real-time methane monitoring system for underground coal mines using IoT sensors',
    'Wireless sensor network for gas and temperature monitoring in underground workings',
    'Mechanized roof bolting system for improved underground mine safety',
    'Early warning system for roof fall prediction using strata monitoring instruments',
    'Wearable smart helmet for worker location tracking and safety alerts in mines',
    'Spontaneous heating and fire detection in coal stockpiles using thermal imaging',
    'Underground mine ventilation network optimization using simulation software',
    'Blast-induced ground vibration prediction and control in opencast mines'
  ],
  'Geotechnical & mine planning': [
    'Slope stability analysis and prediction system for opencast mines using machine learning',
    'Land subsidence monitoring over underground workings using satellite InSAR data',
    'Drone-based topographic survey and volume estimation for opencast mines',
    '3D geological modelling and coal reserve estimation using borehole data and GIS',
    'Optimal truck-shovel dispatch and fleet scheduling in opencast mines',
    'Dragline operation performance optimization using operator-assist analytics'
  ],
  'Coal processing & utilization': [
    'Development of low-cost coal beneficiation techniques for high-ash Indian coal',
    'Underground coal gasification feasibility study for deep unmineable coal seams',
    'Coal-to-methanol conversion pilot using gasification of high-ash coal',
    'Study on coal bed methane extraction techniques in Jharia coalfield',
    'Coal quality forecasting and blending optimization for power plant supply',
    'Automated coal sampling and real-time quality analysis at loading points'
  ],
  'Environment & reclamation': [
    'Utilization of fly ash for production of geopolymer bricks',
    'Coal mine water treatment using constructed wetlands',
    'Automated dust suppression system for opencast coal mining operations',
    'Rehabilitation and afforestation strategies for post-mining land reclamation',
    'Solar power plants on reclaimed mine land and overburden dumps',
    'Carbon capture and utilization feasibility for coal-based power and mining operations',
    'Acid mine drainage prediction and low-cost neutralization methods',
    'Air quality monitoring and pollutant forecasting network around coalfields'
  ],
  'Logistics & digitalization': [
    'Conveyor belt condition monitoring and predictive maintenance using vibration analytics',
    'Digital twin of a coal handling plant for throughput optimization'
  ]
};

const REFERENCE = Object.values(GROUPS).flat();
REFERENCE.groups = GROUPS;
module.exports = REFERENCE;
