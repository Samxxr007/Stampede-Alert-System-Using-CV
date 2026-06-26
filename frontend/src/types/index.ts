/* ============================================================
   CROWDSENSE AI — TYPE SYSTEM
   Aligned with backend schemas (FastAPI + PostgreSQL)
   ============================================================ */

// ── Enums ──

export enum UserRole {
  Admin = 'admin',
  Operator = 'operator',
}

export enum CameraStatus {
  Active = 'active',
  Inactive = 'inactive',
  Error = 'error',
}

export enum DensityLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum RiskLevel {
  Safe = 'safe',
  Watch = 'watch',
  Warning = 'warning',
  Critical = 'critical',
}

export enum AlertType {
  Dashboard = 'dashboard',
  Email = 'email',
  SMS = 'sms',
  WhatsApp = 'whatsapp',
  Push = 'push',
}

export enum AlertPriority {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical',
}

export enum AlertStatus {
  Active = 'active',
  Acknowledged = 'acknowledged',
  Resolved = 'resolved',
}

export enum AnomalyType {
  None = 'none',
  OpposingMovement = 'opposing_movement',
  SuddenRunning = 'sudden_running',
  CrowdDispersion = 'crowd_dispersion',
  CrowdConvergence = 'crowd_convergence',
  ChaoticMovement = 'chaotic_movement',
}

// ── Auth ──

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role?: UserRole;
}

// ── Camera ──

export interface ZoneConfig {
  rows: number;
  cols: number;
}

export interface Camera {
  id: number;
  name: string;
  location: string | null;
  description: string | null;
  stream_url: string;
  status: CameraStatus;
  zone_config: ZoneConfig | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface CameraCreate {
  name: string;
  location?: string;
  description?: string;
  stream_url: string;
  zone_config?: ZoneConfig;
  latitude?: number;
  longitude?: number;
}

export interface CameraUpdate {
  name?: string;
  location?: string;
  description?: string;
  stream_url?: string;
  status?: CameraStatus;
  zone_config?: ZoneConfig;
  latitude?: number;
  longitude?: number;
}

export interface CameraListResponse {
  cameras: Camera[];
  total: number;
}

// ── Density ──

export interface DensityData {
  id: number;
  camera_id: number;
  frame_id: number;
  timestamp: string;
  zone_scores: Record<string, number>;
  overall_density: number;
  level: DensityLevel;
  crowd_count_estimate: number;
  occupied_area_pct: number;
  heatmap_path: string | null;
  hotspots: Array<{ x: number; y: number; intensity: number }>;
}

// ── Motion ──

export interface MotionData {
  id: number;
  camera_id: number;
  frame_id: number;
  timestamp: string;
  flow_vectors: unknown;
  avg_speed: number;
  avg_direction: number;
  max_speed: number;
  speed_variance: number;
  anomaly_type: AnomalyType;
  anomaly_score: number;
  flow_consistency: number;
}

// ── Risk ──

export interface RiskScore {
  id: number;
  camera_id: number;
  timestamp: string;
  density_score: number;
  congestion_score: number;
  motion_anomaly_score: number;
  speed_variance: number;
  risk_percentage: number;
  risk_level: RiskLevel;
  confidence: number;
}

// ── Alert ──

export interface Alert {
  id: number;
  camera_id: number;
  risk_score_id: number | null;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string | null;
  status: AlertStatus;
  evidence_path: string | null;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
}

export interface AlertCreate {
  camera_id: number;
  type?: AlertType;
  priority?: AlertPriority;
  title: string;
  message?: string;
}

export interface AlertListResponse {
  alerts: Alert[];
  total: number;
  active_count: number;
  warning_count: number;
  critical_count: number;
}

export interface AlertResolveRequest {
  resolution_note?: string;
}

// ── Dashboard ──

export interface CameraStat {
  id: number;
  name: string;
  location: string | null;
  status: CameraStatus;
  risk_level: RiskLevel;
  risk_percentage: number;
}

export interface DashboardSummary {
  active_cameras: number;
  total_cameras: number;
  current_crowd_count: number;
  current_risk_level: RiskLevel;
  current_risk_percentage: number;
  active_alerts: number;
  warning_alerts: number;
  critical_alerts: number;
  avg_density: number;
  avg_motion_speed: number;
  cameras: CameraStat[];
}

// ── Analytics ──

export interface DensityDataResponse {
  id: number;
  camera_id: number;
  timestamp: string;
  overall_density: number;
  level: DensityLevel;
  crowd_count_estimate: number;
}

export interface DensityTrendResponse {
  data: DensityDataResponse[];
  avg_density: number;
  max_density: number;
  total_records: number;
}

export interface MotionDataResponse {
  id: number;
  camera_id: number;
  timestamp: string;
  avg_speed: number;
  max_speed: number;
  anomaly_type: AnomalyType;
  anomaly_score: number;
}

export interface MotionTrendResponse {
  data: MotionDataResponse[];
  avg_speed: number;
  max_speed: number;
  anomaly_count: number;
  total_records: number;
}

export interface RiskScoreResponse {
  id: number;
  camera_id: number;
  timestamp: string;
  risk_percentage: number;
  risk_level: RiskLevel;
  density_score: number;
  congestion_score: number;
  motion_anomaly_score: number;
}

export interface RiskTrendResponse {
  data: RiskScoreResponse[];
  current_risk: number;
  avg_risk: number;
  max_risk: number;
  total_records: number;
}

export interface AnalyticsQuery {
  camera_id?: number;
  from_time?: string;
  to_time?: string;
  limit?: number;
  offset?: number;
}

// ── WebSocket ──

export interface WSDensityData {
  zone_scores: Record<string, number>;
  overall_density: number;
  overall_level: DensityLevel;
  congestion_score: number;
  hotspots: Array<{ x: number; y: number; intensity: number }>;
  crowd_count: number;
  occupied_area_pct: number;
}

export interface WSMotionData {
  avg_speed: number;
  max_speed: number;
  speed_variance: number;
  avg_direction: number;
  flow_consistency: number;
  anomaly_type: AnomalyType;
  anomaly_score: number;
}

export interface WSRiskData {
  density_score: number;
  congestion_score: number;
  motion_anomaly_score: number;
  speed_variance: number;
  risk_percentage: number;
  risk_level: RiskLevel;
  confidence: number;
}

export interface WSAnalyticsData {
  camera_id: number;
  frame_number: number;
  timestamp: string;
  processing_time: number;
  density: WSDensityData;
  motion: WSMotionData;
  risk: WSRiskData;
}

export interface WSAlertData {
  alert: Alert;
  camera_name: string;
}

// ── Simulation (client-side) ──

export interface SimulationParams {
  crowdSize: number;
  securityCount: number;
  exitGates: number;
  venueCapacity: number;
  emergencyRoutes: number;
  scenario: 'normal' | 'emergency' | 'evacuation' | 'surge';
  venueType: 'stadium' | 'concert' | 'conference' | 'outdoor';
}

export interface SimulationZone {
  id: string;
  name: string;
  density: number;
  risk: RiskLevel;
  crowdCount: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SimulationResult {
  riskScore: number;
  riskLevel: RiskLevel;
  safetyScore: number;
  evacuationTime: number;
  capacityUtilization: number;
  bottlenecks: string[];
  zones: SimulationZone[];
  recommendations: string[];
}

// ── Processing Pipeline ──

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  metrics?: Record<string, number | string>;
}

// ── UI Component Props ──

export interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface MetricCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  trend?: number;
  icon?: React.ReactNode;
  color?: string;
}

export interface RiskIndicatorProps {
  level: RiskLevel;
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}
