import logging
from typing import Optional
from agents.base_agent import BaseGeminiAgent
from agents.schemas import CastingResult, CharacterCasting, ActorMatch, ScriptBreakdownResult, ResourceForecastResult

logger = logging.getLogger(__name__)

class CastingDirectorAgent(BaseGeminiAgent):
    """
    Autonomous AI Casting Director & Star Attachment Agent.
    Analyzes screenplay characters, emotional complexity, age brackets, and dialogue density
    to recommend A-list talent, calculate character-actor fit scores, and forecast talent quotes.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        super().__init__(agent_name="CastingDirectorAgent", model_name=model_name)

    def attach_talent(
        self,
        script_text: str,
        breakdown: Optional[ScriptBreakdownResult] = None,
        forecast: Optional[ResourceForecastResult] = None
    ) -> CastingResult:
        title = breakdown.script_title if breakdown else "Film Project"
        genre = breakdown.genre if breakdown else "Cinematic Drama"
        total_budget = forecast.total_budget_usd if forecast else 5000000.0

        prompt = f"""
You are an elite Hollywood Casting Director (CDG / BAFTA / Academy member).
Analyze the screenplay titled '{title}' (Genre: {genre}, Total Budget: ${total_budget:,.2f}).

Review the characters extracted from the script and attach premier real-world actors.
For each major character, provide:
1. 'primary_pick': Ideal A-list or marquee star attachment with:
   - 'actor_name': Real-world actor name.
   - 'bankability_tier': e.g., 'A-List Global Draw', 'Rising Star', 'Seasoned Character Actor'.
   - 'match_score_pct': Alignment score (0-100).
   - 'estimated_talent_fee_usd': Estimated quote in USD appropriate for a ${total_budget:,.0f} budget.
   - 'reference_performances': 2 notable films demonstrating this exact energy.
   - 'casting_rationale': Why this actor elevates the role's commercial & artistic viability.
2. 'alternative_indie_pick': High-prestige, budget-friendly alternate actor.

Also provide:
- 'ensemble_overview': Holistic dynamic of the cast.
- 'projected_star_power_tier': Marquee Blockbuster, Prestige Award Contender, High-Concept Genre Draw.
- 'estimated_total_cast_budget_usd': Total budget required for the ensemble.

Screenplay Text:
{script_text[:4000]}
"""
        def fallback_factory() -> CastingResult:
            return self._build_deterministic_fallback(title, genre, total_budget)

        return self.generate_structured(
            prompt=prompt,
            response_schema=CastingResult,
            fallback_data_factory=fallback_factory
        )

    def _build_deterministic_fallback(self, title: str, genre: str, total_budget: float) -> CastingResult:
        is_cyber = "sci-fi" in genre.lower() or "cyber" in genre.lower() or "neon" in title.lower()

        if is_cyber:
            characters = [
                CharacterCasting(
                    character_name="Kaelen Cross",
                    character_archetype="Cybernetic Netrunner / Antihero Protagonist",
                    primary_pick=ActorMatch(
                        actor_name="Keanu Reeves",
                        bankability_tier="A-List Global Draw",
                        match_score_pct=96,
                        estimated_talent_fee_usd=1200000.0,
                        reference_performances=["John Wick 4", "The Matrix Resurrections", "Cyberpunk 2077"],
                        casting_rationale="Brings iconic stoic intensity, deep physical familiarity with stylized gun-fu, and massive worldwide sci-fi fan loyalty."
                    ),
                    alternative_indie_pick=ActorMatch(
                        actor_name="Lakeith Stanfield",
                        bankability_tier="High-Profile Indie Darling",
                        match_score_pct=91,
                        estimated_talent_fee_usd=650000.0,
                        reference_performances=["Sorry to Bother You", "Judas and the Black Messiah", "Knives Out"],
                        casting_rationale="Infuses unpredictable psychological vulnerability and hypnotic eccentricity into Kaelen's cognitive overload."
                    )
                ),
                CharacterCasting(
                    character_name="Nyx Vane",
                    character_archetype="Tactical Infiltration Specialist / Combat Specialist",
                    primary_pick=ActorMatch(
                        actor_name="Florence Pugh",
                        bankability_tier="A-List Global Draw",
                        match_score_pct=94,
                        estimated_talent_fee_usd=950000.0,
                        reference_performances=["Dune: Part Two", "Black Widow", "Oppenheimer"],
                        casting_rationale="Mastery of grounded tactical physicality paired with sharp acerbic humor; commands every frame with fierce screen authority."
                    ),
                    alternative_indie_pick=ActorMatch(
                        actor_name="Jessica Henwick",
                        bankability_tier="Rising Star",
                        match_score_pct=89,
                        estimated_talent_fee_usd=400000.0,
                        reference_performances=["Glass Onion", "The Matrix Resurrections", "Iron Fist"],
                        casting_rationale="Elite wire-stunt athleticism and charismatic presence that naturally balances Kaelen's cynical veteran demeanor."
                    )
                ),
                CharacterCasting(
                    character_name="Vance Sterling",
                    character_archetype="Corporate Antagonist / OmniCorp Security Chief",
                    primary_pick=ActorMatch(
                        actor_name="Mads Mikkelsen",
                        bankability_tier="Seasoned Character Icon",
                        match_score_pct=97,
                        estimated_talent_fee_usd=800000.0,
                        reference_performances=["Casino Royale", "Rogue One", "Hannibal"],
                        casting_rationale="The definitive master of civilized menace; exudes cold predatory precision and corporate sophistication without raising his voice."
                    ),
                    alternative_indie_pick=ActorMatch(
                        actor_name="Giancarlo Esposito",
                        bankability_tier="Prestige Television Legend",
                        match_score_pct=93,
                        estimated_talent_fee_usd=500000.0,
                        reference_performances=["Breaking Bad", "The Mandalorian", "The Boys"],
                        casting_rationale="Unrivaled stillness and calm chilling articulation that elevates Vance into an unforgettable ideological foil."
                    )
                )
            ]
            return CastingResult(
                ensemble_overview="A high-voltage collision of legendary action cinema icons and razor-sharp contemporary prestige actors, delivering both international box office muscle and critical acclaim.",
                projected_star_power_tier="Marquee Blockbuster Tier (Worldwide Theatrical Magnet)",
                estimated_total_cast_budget_usd=2950000.0,
                characters=characters
            )
        else:
            characters = [
                CharacterCasting(
                    character_name="Lead Protagonist",
                    character_archetype="Driven Investigator / Troubled Hero",
                    primary_pick=ActorMatch(
                        actor_name="Oscar Isaac",
                        bankability_tier="A-List Global Draw",
                        match_score_pct=95,
                        estimated_talent_fee_usd=1100000.0,
                        reference_performances=["Ex Machina", "Moon Knight", "Dune"],
                        casting_rationale="Supreme dramatic gravitas combined with nuanced psychological tension and worldwide festival prestige."
                    ),
                    alternative_indie_pick=ActorMatch(
                        actor_name="Dev Patel",
                        bankability_tier="High-Profile Indie Darling",
                        match_score_pct=90,
                        estimated_talent_fee_usd=550000.0,
                        reference_performances=["Monkey Man", "The Green Knight", "Lion"],
                        casting_rationale="Incredible emotional resonance and raw vulnerability that hooks audiences immediately."
                    )
                ),
                CharacterCasting(
                    character_name="Lead Antagonist / Enigma",
                    character_archetype="Calculating Power Broker",
                    primary_pick=ActorMatch(
                        actor_name="Cate Blanchett",
                        bankability_tier="Prestige Academy Award Winner",
                        match_score_pct=98,
                        estimated_talent_fee_usd=1300000.0,
                        reference_performances=["Tár", "Blue Jasmine", "Thor: Ragnarok"],
                        casting_rationale="Brings overwhelming intellectual stature and magnetic intensity that elevates every dialogue exchange."
                    ),
                    alternative_indie_pick=ActorMatch(
                        actor_name="Rebecca Ferguson",
                        bankability_tier="A-List Star",
                        match_score_pct=92,
                        estimated_talent_fee_usd=700000.0,
                        reference_performances=["Mission: Impossible", "Dune", "Silo"],
                        casting_rationale="Fierce poise, piercing screen presence, and masterclass dramatic ambiguity."
                    )
                )
            ]
            return CastingResult(
                ensemble_overview="Prestige ensemble engineered for Academy Award consideration and international festival circuit distribution.",
                projected_star_power_tier="Prestige Award Contender Tier",
                estimated_total_cast_budget_usd=2400000.0,
                characters=characters
            )
