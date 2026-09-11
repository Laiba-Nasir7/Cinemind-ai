import logging
from typing import Optional
from agents.base_agent import BaseGeminiAgent
from agents.schemas import StudioDebateResult, DebateStatement, ScriptBreakdownResult, ResourceForecastResult

logger = logging.getLogger(__name__)

class StudioDebateAgent(BaseGeminiAgent):
    """
    Autonomous Studio War Room Agent.
    Simulates a high-stakes executive debate between a Visionary Director (demanding artistic scale)
    and a Studio Line Producer / CFO (demanding financial efficiency, safety, and tax rebates).
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        super().__init__(agent_name="StudioDebateAgent", model_name=model_name)

    def debate(
        self,
        script_text: str,
        breakdown: Optional[ScriptBreakdownResult] = None,
        forecast: Optional[ResourceForecastResult] = None
    ) -> StudioDebateResult:
        title = breakdown.script_title if breakdown else "Screenplay Project"
        genre = breakdown.genre if breakdown else "Film Production"
        budget = forecast.total_budget_usd if forecast else 5000000.0

        prompt = f"""
You are staging an autonomous executive Greenlight War Room debate for '{title}' (Genre: {genre}, Projected Budget: ${budget:,.2f}).
Simulate a sharp, witty, highly professional confrontation between two personas:
1. 'Director (Visionary)': Demands maximum cinematic realism, IMAX camera packages, real physical stunt work, and immersive locations.
2. 'Line Producer (CFO)': Pragmatic, cost-focused, safety-conscious, obsessed with SAG turnaround times, insurance premiums, and tax rebates.

They must debate:
- High-cost scene execution (Practical stunts vs virtual LED volume vs VFX).
- Location shoot permits vs soundstage construction.
- Safety flags and contingency budgets.

Return a 'StudioDebateResult' containing:
- 'debate_topic': Core production tension.
- 'director_vision': Summary of director's creative pitch.
- 'producer_constraints': Summary of line producer's budgetary/insurance reality.
- 'debate_exchanges': 4 alternating exchanges (Director -> Producer -> Director -> Producer) with sharp dialogue and counter-proposals.
- 'consensus_agreement': The final creative-financial compromise reached.
- 'greenlight_status': 'GREENLIT WITH CONDITIONS' or 'APPROVED'.

Script Context:
{script_text[:3500]}
"""
        def fallback_factory() -> StudioDebateResult:
            return self._build_deterministic_fallback(title, budget)

        return self.generate_structured(
            prompt=prompt,
            response_schema=StudioDebateResult,
            fallback_data_factory=fallback_factory
        )

    def _build_deterministic_fallback(self, title: str, budget: float) -> StudioDebateResult:
        return StudioDebateResult(
            debate_topic="Practical Zero-Gravity Stunt Rigging vs. LED Volume Virtual Production",
            director_vision="I refuse to shoot the vault infiltration on a generic green screen. We need physical wirework suspended 40 feet in the air with practical atmospheric smoke and real IMAX 70mm glass to capture raw visceral vertigo.",
            producer_constraints=f"Our bond company will not insure live high-wire pyrotechnics in an uncontrolled exterior without a $650,000 contingency escrow. At a ${budget:,.0f} baseline, we blow our completion bond on day four.",
            debate_exchanges=[
                DebateStatement(
                    speaker="Director",
                    avatar_role="Visionary Director",
                    stance="Creative Ambition",
                    dialogue="If we fake the gravity-drift with post-VFX motion blur, the audience will smell the artificiality immediately. We need Nolan-level practical immersion—real cables, real zero-g rotational rigs for the actors.",
                    compromise_offered="We can consolidate the two alley chase scenes into one soundstage unit to free up 3 shoot days."
                ),
                DebateStatement(
                    speaker="Line Producer",
                    avatar_role="Studio Line Producer (CFO)",
                    stance="Budgetary Prudence",
                    dialogue="Three days of specialized wire harness rigging requires certified aerial coordinators and double SAG stunt-rider rates. That adds $280K just in daily overtime.",
                    compromise_offered="Bring in an LED Volume soundstage in London or Atlanta to capture 40% UK tax credits and eliminate night weather delays."
                ),
                DebateStatement(
                    speaker="Director",
                    avatar_role="Visionary Director",
                    stance="Creative Ambition",
                    dialogue="Deal on the Atlanta stage for interior dialogue, but the climactic vault breach must feature the physical hydraulic rig. The physical strain on the protagonist's face cannot be simulated.",
                    compromise_offered="I'll shoot with available lighting and cut the second crane unit."
                ),
                DebateStatement(
                    speaker="Line Producer",
                    avatar_role="Studio Line Producer (CFO)",
                    stance="Budgetary Prudence",
                    dialogue="Agreed. Hybrid model: 2 days practical hydraulic rig with dual-cable safety redundancy, remaining sequence shot in the LED Volume with local tax credits. Total savings: $420,000.",
                    compromise_offered="Contingency approved at 12% with mandatory daily safety supervisor signoff."
                )
            ],
            consensus_agreement="Hybrid Production Approved: Core visceral stunt moments executed on practical physical motion gimbal rigs under strict SAG safety protocols; non-stunt exterior environments shifted to an Unreal Engine 5.4 LED Volume stage leveraging 30% regional film tax credits.",
            greenlight_status="GREENLIT WITH CONDITIONS"
        )
