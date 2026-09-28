// Demo proposals — one click fills the form so the live demo needs no typing.
export const SAMPLES = [
  {
    id: 'combustion',
    label: 'Spontaneous combustion detection (fibre-optic + ML)',
    expect: 'High novelty · budget within range',
    title: 'AI-Driven Early Detection of Spontaneous Combustion in Underground Coal Seams Using Distributed Fibre-Optic Sensing',
    proposer: 'IIT (ISM) Dhanbad',
    budget: '85',
    duration: '18',
    text: `Spontaneous combustion of coal is a leading cause of underground mine fires in the Jharia coalfield, causing loss of reserves, sealing of productive districts and risk to miners. Current detection relies on periodic manual gas sampling and point sensors, which identify heating only after it is well advanced.

This project will deploy distributed temperature sensing (DTS) fibre-optic cables along goaf edges and pillar walls to capture continuous temperature profiles at 1 m resolution. A machine learning model will combine these temperature gradients with CO/CO2 ratios to predict incipient heating 7-10 days earlier than current methods. A web dashboard will show mine management a risk score for each monitored zone.

Unlike point-sensor gas monitoring and surface thermal imaging of stockpiles, this integrated underground fibre-optic + ML system has not been field-tested in Indian coal mines.`
  },
  {
    id: 'longwall',
    label: 'Predictive maintenance for longwall equipment',
    expect: 'Novel application · reasonable budget',
    title: 'AI-Based Predictive Maintenance for Longwall Mining Equipment',
    proposer: 'IIT Kharagpur',
    budget: '65',
    duration: '18',
    text: `This project proposes a predictive maintenance system for longwall mining equipment using vibration sensors, acoustic emission monitoring, and a deep learning model trained to detect early signs of mechanical failure in shearer drums and armored face conveyors. Unlike existing reactive maintenance practices, this system will provide 48-72 hour advance failure warnings, reducing unplanned downtime and improving worker safety. The model will be trained on sensor data collected from three partner coal mines over a 6-month period, followed by field validation.`
  },
  {
    id: 'slope',
    label: 'ML slope failure prediction (near-duplicate)',
    expect: 'Low novelty — overlaps an existing project',
    title: 'Machine Learning Model for Mine Slope Failure Prediction',
    proposer: 'NIT Rourkela',
    budget: '40',
    duration: '12',
    text: `This project aims to develop a machine learning-based system for predicting slope stability and failure risk in opencast coal mines. The system will use historical geotechnical data, rainfall patterns, and slope geometry to train a classification model that flags high-risk zones before failure occurs, similar to prior slope stability prediction efforts in Indian opencast mines.`
  },
  {
    id: 'drones',
    label: 'Dust-suppression drone swarm (over budget)',
    expect: 'Budget far above the benchmark',
    title: 'Dust Suppression Drone Swarm for Opencast Mines',
    proposer: 'BIT Mesra',
    budget: '350',
    duration: '10',
    text: `This project proposes a swarm of autonomous drones equipped with fine water mist sprayers to suppress airborne coal dust in opencast mining areas. The drones will operate autonomously using GPS-guided flight paths and will be coordinated via a central control system that responds to real-time dust sensor readings across the mine site.`
  },
  {
    id: 'reserves',
    label: 'National reserve estimation platform (under budget)',
    expect: 'Budget far below the benchmark',
    title: 'National-Scale Coal Reserve Estimation Platform Using Satellite AI',
    proposer: 'ISM Dhanbad',
    budget: '15',
    duration: '36',
    text: `This project proposes building a nationwide platform that uses satellite imagery and deep learning to estimate coal reserves across all major Indian coalfields, integrating multispectral imaging, geological survey data, and historical extraction records into a unified reserve-estimation dashboard for use by the Ministry of Coal and state agencies.`
  }
];
