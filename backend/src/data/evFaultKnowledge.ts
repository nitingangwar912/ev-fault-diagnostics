export interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  metadata: {
    faultCode: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    resolution: string[];
    estimatedDowntime: string;
  };
}

export const EV_FAULT_KNOWLEDGE: KnowledgeDoc[] = [
  {
    id: 'ev_fault_001',
    title: 'OCPP Communication Error',
    content: `OCPP (Open Charge Point Protocol) communication errors occur when the charge point loses connectivity with the Central Management System (CSMS). This fault manifests as persistent offline status, failed transaction starts, or heartbeat timeout alerts. The OCPP protocol uses WebSocket connections (OCPP 1.6) or HTTP/2 with JSON (OCPP 2.0.1) for real-time bidirectional communication. Common triggers include network configuration changes, SSL certificate expiry, firewall rule updates blocking WebSocket port 443, or CSMS endpoint URL changes. The charge point logs will show BootNotification failure or Heartbeat timeout exceeded errors. When the charge point cannot reach the CSMS, it enters offline mode and may queue transactions locally.`,
    keywords: ['ocpp', 'communication', 'backend', 'offline', 'heartbeat', 'csms', 'websocket', 'connect', 'protocol', 'network', 'connectivity'],
    metadata: {
      faultCode: 'E001',
      severity: 'high',
      category: 'Communication',
      resolution: [
        'Verify network connectivity at charger location using ping test',
        'Check OCPP endpoint URL and WebSocket path in charger configuration',
        'Validate SSL/TLS certificate validity and expiry date',
        'Review firewall rules to ensure WebSocket traffic is permitted on port 443',
        'Restart the charge point and monitor BootNotification response',
        'Enable OCPP debug logging to capture handshake failure details'
      ],
      estimatedDowntime: '15–45 minutes'
    }
  },
  {
    id: 'ev_fault_002',
    title: 'Ground Fault Detection (GFCI Trip)',
    content: `Ground fault detection errors occur when the EVSE detects an imbalance between the current flowing out on the live conductor and returning on the neutral conductor, indicating current is leaking to ground. The GFCI (Ground Fault Circuit Interrupter) is a critical safety device that trips when leakage current exceeds 5mA, protecting users from electric shock. Causes include moisture ingress into the connector or cable assembly, damaged insulation on the charging cable, faulty vehicle onboard charger, wiring faults within the EVSE enclosure, or a malfunctioning GFCI module. The fault code typically appears as an immediate trip during plug-in or shortly after charging begins.`,
    keywords: ['ground', 'fault', 'gfci', 'earth', 'leakage', 'trip', 'safety', 'moisture', 'insulation', 'current imbalance'],
    metadata: {
      faultCode: 'E002',
      severity: 'critical',
      category: 'Electrical Safety',
      resolution: [
        'Immediately take the unit out of service and post an out-of-order notice',
        'Inspect the charging cable and connector for physical damage or moisture',
        'Test with a known-good vehicle to isolate whether fault is in EVSE or vehicle',
        'Use a megohmmeter to test insulation resistance on all conductors',
        'Inspect EVSE enclosure for water ingress and seal any entry points',
        'Replace GFCI module if it trips repeatedly with no load connected'
      ],
      estimatedDowntime: '2–8 hours (safety-critical, must be resolved before return to service)'
    }
  },
  {
    id: 'ev_fault_003',
    title: 'Overcurrent Protection Trip',
    content: `Overcurrent faults occur when the electrical current drawn exceeds the rated capacity of the EVSE circuit breaker or internal protection relay. This protects wiring and components from thermal damage. Causes include a vehicle requesting more current than the circuit is rated for (configuration mismatch), load balancing failure in multi-unit installations, a failing power module drawing excess current, or a short circuit condition. In smart charging deployments using OCPP Smart Charging profiles, a misconfigured ChargingSchedule can cause the charger to negotiate incorrect current limits with the vehicle.`,
    keywords: ['overcurrent', 'current', 'overload', 'breaker', 'circuit', 'ampere', 'amps', 'trip', 'load', 'capacity'],
    metadata: {
      faultCode: 'E003',
      severity: 'high',
      category: 'Electrical Protection',
      resolution: [
        'Reset the circuit breaker after allowing a 5-minute cool-down period',
        'Verify the configured maximum current in EVSE settings matches circuit rating',
        'Check OCPP Smart Charging profile for incorrect ChargingSchedule values',
        'Inspect power module for signs of overheating or component failure',
        'Measure actual current draw during charging session with a clamp meter',
        'Review load balancing configuration in multi-unit installations'
      ],
      estimatedDowntime: '30 minutes to 2 hours'
    }
  },
  {
    id: 'ev_fault_004',
    title: 'Temperature Sensor Fault / Thermal Runaway Warning',
    content: `Temperature faults are triggered when internal sensors detect operating temperatures outside safe thresholds. Modern EVSEs incorporate multiple NTC thermistors monitoring the power electronics, connector contacts, and ambient conditions. High temperatures (above 85°C on power stage components) trigger current derating or shutdown to prevent damage. Causes include blocked ventilation slots, failed cooling fans, extreme ambient temperatures, connector contact resistance increased due to arcing or corrosion, or a faulty sensor providing false readings. Persistent high connector temperatures indicate poor contact and risk of thermal damage to the cable assembly.`,
    keywords: ['temperature', 'thermal', 'heat', 'overheat', 'sensor', 'thermistor', 'cooling', 'fan', 'ventilation', 'hot'],
    metadata: {
      faultCode: 'E004',
      severity: 'high',
      category: 'Thermal Management',
      resolution: [
        'Allow unit to cool down with power disconnected for minimum 30 minutes',
        'Inspect and clear all ventilation slots of dust, debris, or obstructions',
        'Check cooling fan operation — replace if not spinning at rated RPM',
        'Inspect connector contacts for discolouration, pitting, or carbon deposits',
        'Verify ambient temperature is within operating range (typically -30°C to +50°C)',
        'Replace temperature sensor if readings are inconsistent or implausible'
      ],
      estimatedDowntime: '1–4 hours'
    }
  },
  {
    id: 'ev_fault_005',
    title: 'Connector Lock Mechanism Failure',
    content: `Connector lock faults occur when the electromechanical lock in a Type 2 (IEC 62196) or CCS connector fails to engage or disengage correctly. The lock is a mandatory safety feature that prevents the connector from being removed while current is flowing. Failures manifest as the connector being stuck locked (unable to remove after session ends), failing to lock at session start (causing immediate fault), or intermittent lock state reporting. Causes include mechanical wear on the actuator, foreign object obstruction in the lock mechanism, solenoid coil failure, or a faulty lock position sensor.`,
    keywords: ['connector', 'lock', 'plug', 'stuck', 'cable', 'unlock', 'socket', 'type2', 'ccs', 'actuator', 'mechanical'],
    metadata: {
      faultCode: 'E005',
      severity: 'medium',
      category: 'Mechanical',
      resolution: [
        'Do not force the connector — this risks damaging the locking pin',
        'Use the manual override key (if equipped) to release a stuck connector',
        'Inspect the lock actuator aperture for foreign objects or debris',
        'Test solenoid coil resistance (typically 8–12 Ohms for healthy coil)',
        'Check lock position sensor wiring for continuity and secure connections',
        'Lubricate lock mechanism with approved non-conductive contact lubricant'
      ],
      estimatedDowntime: '1–3 hours'
    }
  },
  {
    id: 'ev_fault_006',
    title: 'Control Pilot Signal Error (IEC 61851)',
    content: `Control pilot (CP) signal errors indicate a fault in the PWM-based communication channel between the EVSE and the electric vehicle, defined in IEC 61851-1. The CP line carries a ±12V pilot signal that transitions through states A (not connected, +12V DC), B (vehicle connected, +9V), C (vehicle ready to charge, +6V), and D (ventilation required, +3V). Fault conditions include: CP signal stuck in state A despite vehicle connection, voltage outside tolerance bands, signal oscillation, or the vehicle failing to transition states correctly. Causes include EVSE CP circuit component failure, damaged cable assembly, vehicle EVSE controller fault, or incorrect resistor values in the vehicle's inlet circuit.`,
    keywords: ['pilot', 'signal', 'cp', 'control', 'pwm', 'iec61851', 'state', 'voltage', 'proximity', 'pp', 'evse', 'inlet'],
    metadata: {
      faultCode: 'E006',
      severity: 'high',
      category: 'Communication Protocol',
      resolution: [
        'Measure CP signal voltage with multimeter: +12V (state A), +9V (state B), +6V (state C)',
        'Test with a known-good vehicle to isolate EVSE versus vehicle fault',
        'Inspect CP line continuity in charging cable — resistance should be <1 Ohm',
        'Check for CP-PE (pilot to protective earth) short circuit in cable assembly',
        'Verify EVSE CP circuit oscillator is generating correct 1kHz PWM signal',
        'Inspect vehicle inlet connector pins for damage or corrosion'
      ],
      estimatedDowntime: '1–6 hours'
    }
  },
  {
    id: 'ev_fault_007',
    title: 'DC Power Module Failure',
    content: `DC power module faults are specific to DC fast chargers (DCFC) and indicate failure in the AC-to-DC conversion stage. DC fast chargers use multiple power modules (typically 15–30kW each) that operate in parallel to achieve total output power of 50–350kW. A module fault may degrade total available charging power (e.g., a 150kW charger drops to 120kW with one failed module) or cause complete charging failure if all modules are affected. Causes include capacitor degradation, IGBT/MOSFET switching device failure, control board firmware hang, power module overtemperature, or input phase loss on the AC supply.`,
    keywords: ['power', 'module', 'dc', 'charging', 'dcfc', 'fast', 'ac', 'inverter', 'igbt', 'converter', 'rectifier', 'output'],
    metadata: {
      faultCode: 'E007',
      severity: 'critical',
      category: 'Power Electronics',
      resolution: [
        'Identify which specific module(s) have faulted via charger management interface',
        'Attempt module restart via software — many transient faults clear on reset',
        'Check input AC voltage at module terminals — all three phases must be present',
        'Verify module cooling system: fans operational, coolant flow nominal (liquid-cooled)',
        'Download module event log for fault codes before replacement',
        'Replace faulty module following manufacturer lockout/tagout procedure — high voltage hazard'
      ],
      estimatedDowntime: '2–24 hours (module swap requires certified technician)'
    }
  },
  {
    id: 'ev_fault_008',
    title: 'Authentication & Authorization Failure',
    content: `Authentication failures occur when a user attempts to start a charging session but the EVSE cannot verify their authorization. In OCPP networks, authorization is handled via the Authorize.req message sent to the CSMS with the user's IdTag (RFID UID or app token). Failure causes include: expired or revoked RFID card, CSMS authorization service outage, the charger operating with a stale local authorization cache, network failure during authorization request, or misconfigured whitelist. For smart charging networks, token format mismatches between RFID UID formats (ISO 14443A UID length variations) can cause spurious authorization failures.`,
    keywords: ['auth', 'authentication', 'authorization', 'rfid', 'card', 'login', 'access', 'token', 'whitelist', 'idtag', 'user'],
    metadata: {
      faultCode: 'E008',
      severity: 'medium',
      category: 'Access Control',
      resolution: [
        'Verify the RFID card is active and not expired in the CSMS user management portal',
        'Test with a known-valid card or app token to isolate card versus system fault',
        'Check CSMS authorization service health status and recent error logs',
        'Review charger local authorization cache — clear and repopulate if stale',
        'Verify OCPP Authorize.req/conf message exchange in charger debug logs',
        'Check for UID format mismatch: confirm 4-byte versus 7-byte UID handling'
      ],
      estimatedDowntime: '0–2 hours (often resolved via CSMS configuration)'
    }
  }
];
