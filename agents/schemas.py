from typing import List, Optional
from pydantic import BaseModel, Field


class CharacterInfo(BaseModel):
    name: str = Field(description="Character's name as presented in screenplay")
    archetype: str = Field(description="Narrative role (Protagonist, Antagonist, Specialist, Supporting, etc.)")
    estimated_dialogue_count: int = Field(description="Estimated dialogue line count")
    key_wardrobe_props: str = Field(description="Signature costumes, cybernetics, weapons, or gear")


class SceneBreakdown(BaseModel):
    scene_number: int = Field(description="1-based scene sequence index")
    slugline: str = Field(description="Original scene heading e.g., EXT. NEO-TOKYO SKYSCRAPER - NIGHT")
    setting: str = Field(description="INT, EXT, or INT/EXT")
    time_of_day: str = Field(description="DAY, NIGHT, DAWN, DUSK, CONTINUOUS")
    location_name: str = Field(description="Primary location identifier")
    summary: str = Field(description="Concise 2-sentence summary of scene action")
    characters_present: List[str] = Field(description="Names of characters appearing in this scene")
    props_required: List[str] = Field(description="Props, equipment, vehicles, or weapons mentioned")
    emotional_tone: str = Field(description="Dominant mood or emotional resonance")
    estimated_shoot_hours: float = Field(description="Estimated principal photography shooting time in hours")


class ScriptBreakdownResult(BaseModel):
    script_title: str = Field(description="Detected or provided title of film")
    genre: str = Field(description="Primary film genre classification")
    total_scenes: int = Field(description="Total number of scenes identified")
    estimated_pages: float = Field(description="Estimated script length in standard screenplay pages")
    characters: List[CharacterInfo] = Field(description="Character roster analysis")
    scenes: List[SceneBreakdown] = Field(description="Detailed list of scene breakdowns")


class BudgetItem(BaseModel):
    category: str = Field(description="Cast, Location Permits, Stunts/VFX, Props, Wardrobe, Equipment, Post-Production")
    description: str = Field(description="Line item description")
    cost_usd: float = Field(description="Estimated cost in USD")
    rationale: str = Field(description="Reasoning behind cost estimation")


class RiskFlag(BaseModel):
    category: str = Field(description="Safety & Stunts, Weather/Location, Technical/VFX, Budget Overrun")
    severity: str = Field(description="LOW, MEDIUM, HIGH, CRITICAL")
    description: str = Field(description="Specific risk factor identified in screenplay")
    mitigation_strategy: str = Field(description="Recommended production safety or contingency protocol")


class ResourceForecastResult(BaseModel):
    total_budget_usd: float = Field(description="Total estimated principal photography budget in USD")
    budget_tier: str = Field(description="Micro, Low-Budget, Mid-Budget, Studio Blockbuster")
    recommended_crew_size: int = Field(description="Estimated crew headcount needed on set")
    budget_breakdown: List[BudgetItem] = Field(description="Itemized budget allocation list")
    risk_matrix: List[RiskFlag] = Field(description="Identified risk flags and safety protocols")


class ShotPrompt(BaseModel):
    shot_number: int = Field(description="Sequential shot index")
    scene_number: int = Field(description="Associated scene index")
    shot_type: str = Field(description="Wide Shot, Medium Close-Up, Extreme Close-Up, Low-Angle Tracking, Over-the-Shoulder, POV")
    camera_movement: str = Field(description="Static, Steadicam Push-in, Handheld Whip Pan, Crane Tilt, Drone Flyover")
    lighting_palette: str = Field(description="Chiaroscuro, Neon Cyberpunk, Warm Golden Hour, Cold Blue High-Contrast")
    genai_image_prompt: str = Field(description="Detailed prompt formatted for Midjourney v6 / Imagen 3 storyboard generation")
    description: str = Field(description="Visual action occurring in the frame")


class VisualStoryboardResult(BaseModel):
    cinematic_style: str = Field(description="Visual aesthetic description (e.g. Blade Runner 2049 meets Heat)")
    color_palette_hex: List[str] = Field(description="3-5 Hex color codes representing primary visual grade")
    shots: List[ShotPrompt] = Field(description="Shot-by-shot visual storyboards")


class ActorMatch(BaseModel):
    actor_name: str = Field(description="Name of suggested real-world Hollywood / International actor")
    bankability_tier: str = Field(description="A-List Global Draw, High-Profile Indie Darling, Rising Star, Seasoned Character Actor")
    match_score_pct: int = Field(description="Character-Actor alignment percentage (e.g. 94)")
    estimated_talent_fee_usd: float = Field(description="Estimated quote / fee range in USD for principal photography")
    reference_performances: List[str] = Field(description="2-3 notable films showcasing relevant performance style")
    casting_rationale: str = Field(description="Why this actor elevates the role and commercial viability")


class CharacterCasting(BaseModel):
    character_name: str = Field(description="Character name from screenplay")
    character_archetype: str = Field(description="Narrative role (Protagonist, Antagonist, Specialist, etc.)")
    primary_pick: ActorMatch = Field(description="Ideal top-choice star casting")
    alternative_indie_pick: ActorMatch = Field(description="Alternative budget-friendly or prestige indie casting choice")


class CastingResult(BaseModel):
    ensemble_overview: str = Field(description="High-level casting strategy and tonal harmony across the cast")
    projected_star_power_tier: str = Field(description="Marquee Blockbuster, Prestige Award Contender, High-Concept Genre Draw")
    estimated_total_cast_budget_usd: float = Field(description="Combined estimated cast budget across all principal roles")
    characters: List[CharacterCasting] = Field(description="Casting breakdowns for each major character")


class DebateStatement(BaseModel):
    speaker: str = Field(description="Director or Line Producer")
    avatar_role: str = Field(description="Visionary Director or Studio Line Producer (CFO)")
    stance: str = Field(description="Creative Ambition or Budgetary Prudence")
    dialogue: str = Field(description="Persuasive, in-character argument regarding scene scale, locations, or technical execution")
    compromise_offered: Optional[str] = Field(default=None, description="Proposed middle ground or optimization")


class StudioDebateResult(BaseModel):
    debate_topic: str = Field(description="Central production controversy e.g. Practical vs VFX stunts, Location shooting vs LED Volume")
    director_vision: str = Field(description="The Director's uncompromising creative ambition")
    producer_constraints: str = Field(description="The Studio Line Producer's financial & safety guardrails")
    debate_exchanges: List[DebateStatement] = Field(description="Back-and-forth dialogue exchanges between Director and Line Producer")
    consensus_agreement: str = Field(description="The final executive consensus that balances art with financial viability")
    greenlight_status: str = Field(description="GREENLIT WITH CONDITIONS, APPROVED, or REVISE & RESUBMIT")


class GrafanaTelemetryMetrics(BaseModel):
    total_tokens_estimated: int = Field(description="Estimated total token consumption across agent swarm")
    orchestration_latency_ms: int = Field(description="Total agent swarm execution latency in milliseconds")
    agent_count: int = Field(description="Number of autonomous sub-agents executed")
    budget_efficiency_score: float = Field(description="Production budget efficiency index (0.0 - 10.0)")
    safety_compliance_rate: float = Field(description="Percentage compliance with SAG-AFTRA & stunt protocols")
    pipeline_health: str = Field(default="100% OPERATIONAL", description="Overall pipeline health status")


class SceneDNAPoint(BaseModel):
    scene_number: int = Field(description="Scene index (1-based)")
    tension_score: float = Field(description="Tension/conflict intensity on 0-10 scale")
    emotion_label: str = Field(description="Dominant emotion: Hope, Fear, Joy, Rage, Sadness, Suspense, Love, Awe")
    dialogue_density: float = Field(description="Ratio of dialogue lines to action lines (0.0-1.0)")
    pacing_bpm: int = Field(description="Narrative pacing score as beats-per-minute metaphor (40=slow, 120=frantic)")
    color_hex: str = Field(description="Hex color representing emotional hue of the scene")


class ScriptDNAResult(BaseModel):
    overall_arc_shape: str = Field(description="Arc classification: Rising Crescendo, W-Shape Rollercoaster, Slow Burn, Inverted Peak, Flat Tension")
    emotional_fingerprint: str = Field(description="Unique 1-line poetic description of the script's emotional signature")
    average_tension: float = Field(description="Mean tension score across all scenes")
    peak_tension_scene: int = Field(description="Scene number with highest dramatic intensity")
    dialogue_to_action_ratio: float = Field(description="Overall script dialogue vs action balance (0.0-1.0)")
    pacing_verdict: str = Field(description="Pacing assessment: Relentless, Well-Paced, Meditative, Uneven, Front-Loaded")
    scene_dna: List[SceneDNAPoint] = Field(description="Per-scene emotional DNA data points for arc visualization")
    act_structure_notes: str = Field(description="Analysis of 3-act structure adherence and turning points")


class ExecutivePitchResult(BaseModel):
    logline: str = Field(description="Hooky 1-2 sentence commercial film logline")
    synopsis: str = Field(description="Compelling executive story summary")
    comparable_films: List[str] = Field(description="2-3 successful box office comp films (e.g., Matrix, Blade Runner, Heat)")
    target_demographic: str = Field(description="Primary target audience profile")
    market_positioning: str = Field(description="Commercial viability and festival/streaming positioning")
    executive_summary: str = Field(description="Producer summary outlining why this project is greenlight-ready")


class FullPreProductionBible(BaseModel):
    script_breakdown: ScriptBreakdownResult
    resource_forecast: ResourceForecastResult
    visual_storyboard: VisualStoryboardResult
    casting_analysis: Optional[CastingResult] = None
    studio_debate: Optional[StudioDebateResult] = None
    script_dna: Optional[ScriptDNAResult] = None
    telemetry: Optional[GrafanaTelemetryMetrics] = None
    executive_pitch: ExecutivePitchResult
    analysis_timestamp: str
    execution_time_seconds: float


