from typing import List
from .base_agent import BaseGeminiAgent
from .schemas import ScriptBreakdownResult, ResourceForecastResult, BudgetItem, RiskFlag

class BudgetForecastingAgent(BaseGeminiAgent):
    """
    Sub-Agent 2: Budget & Resource Forecasting Agent
    Calculates estimated production costs, crew allocation, and safety risk matrix.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        super().__init__(agent_name="Budget & Logistics Agent", model_name=model_name)

    def forecast_resources(self, breakdown: ScriptBreakdownResult, script_doctor_prompt: str = "") -> ResourceForecastResult:
        doctor_section = f"\n\nScript Doctor Budget Guidance / Custom Directives:\n\"{script_doctor_prompt}\"\nAdjust total budget scaling, crew headcount recommendations, and cost allocations to match these directives." if script_doctor_prompt.strip() else ""

        prompt = f"""You are an executive Line Producer and Production Manager for major Hollywood film studios.
Analyze the following script breakdown and produce a detailed production budget forecast and risk mitigation report.{doctor_section}

Film Title: {breakdown.script_title}
Genre: {breakdown.genre}
Total Scenes: {breakdown.total_scenes}
Characters: {', '.join([c.name for c in breakdown.characters])}
Scenes Overview:
{chr(10).join([f"- Scene {s.scene_number}: {s.slugline} ({s.setting}, {s.time_of_day}) - Props: {', '.join(s.props_required)}" for s in breakdown.scenes])}

Instructions:
1. Estimate total production budget (USD) and budget tier.
2. Provide categorized line-item costs (Cast, Location Permits, Stunts/VFX, Props, Wardrobe, Gear, Post).
3. Recommend set crew size headcount.
4. Identify 3-4 specific production risk flags (stunts, location weather, complex VFX, high-cost props) with severity ratings and safety mitigation strategies.
"""

        def fallback_factory() -> ResourceForecastResult:
            return self._build_deterministic_forecast(breakdown, script_doctor_prompt)

        return self.generate_structured(
            prompt=prompt,
            response_schema=ResourceForecastResult,
            fallback_data_factory=fallback_factory
        )

    def _build_deterministic_forecast(self, breakdown: ScriptBreakdownResult, doctor_prompt: str = "") -> ResourceForecastResult:
        """Deterministic budget calculator fallback."""
        num_scenes = breakdown.total_scenes
        doc_lower = doctor_prompt.lower()
        is_micro = "micro" in doc_lower or "reduce" in doc_lower or "low budget" in doc_lower or "indie" in doc_lower
        is_blockbuster = any(word in breakdown.script_title.upper() or breakdown.genre.upper() for word in ["NEON", "CYBERPUNK", "DRAGON", "EPIC", "BLOCKBUSTER"]) and not is_micro

        if is_micro:
            base_multiplier = 75000.0
            budget_tier = "Micro / Low-Budget Feature ($150K-$1M)"
            crew_size = 18
        elif is_blockbuster:
            base_multiplier = 1500000.0
            budget_tier = "Studio Blockbuster ($30M+)"
            crew_size = 120
        else:
            base_multiplier = 450000.0
            budget_tier = "Mid-Budget Feature ($5M-$15M)"
            crew_size = 45

        total_budget = round(base_multiplier * max(num_scenes, 2), 2)
        budget_tier = "Studio Blockbuster ($30M+)" if total_budget >= 15000000 else "Mid-Budget Feature ($5M-$15M)"
        crew_size = 120 if is_blockbuster else 45

        items = [
            BudgetItem(
                category="Cast & Talent",
                description=f"Principal Cast ({len(breakdown.characters)} leads) + Stunt Double Performers",
                cost_usd=round(total_budget * 0.28, 2),
                rationale="SAG-AFTRA rates for lead actors, stunt double hazard pay, and stand-in fees."
            ),
            BudgetItem(
                category="Location & Stage Permits",
                description="Rooftop, Vault, and Interior Studio Soundstage Rentals",
                cost_usd=round(total_budget * 0.18, 2),
                rationale="City filming permits, police escorts, and midnight noise variance licenses."
            ),
            BudgetItem(
                category="VFX & Practical Effects",
                description="Zero-G Rigging, Holographic HUD overlay graphics, and EMP explosion effects",
                cost_usd=round(total_budget * 0.22, 2),
                rationale="High-density CG environments, laser pulse render compositing, and wirework safety."
            ),
            BudgetItem(
                category="Camera & G&E Equipment",
                description="ARRI Alexa 35 Package, Anamorphic Lenses, High-Speed Camera Drones",
                cost_usd=round(total_budget * 0.14, 2),
                rationale="Cinematic 4K camera packages, magnetic wire rigs, and water-proof camera housings."
            ),
            BudgetItem(
                category="Props & Cyber Wardrobe",
                description="Custom LED Visors, Hero Weapons, Tactical Cyber-Armor",
                cost_usd=round(total_budget * 0.10, 2),
                rationale="Fabrication of glowing prop weaponry, custom tailored wet-weather coats."
            ),
            BudgetItem(
                category="Post-Production Sound & Score",
                description="Orchestral Synth Score, Dolby Atmos Mix, Foley & Sound Design",
                cost_usd=round(total_budget * 0.08, 2),
                rationale="Original synthwave/orchestral score composition and sound FX master mix."
            )
        ]

        risks = [
            RiskFlag(
                category="Safety & Stunts",
                severity="HIGH",
                description="High-altitude rooftop entry and magnetic zero-gravity wire drops.",
                mitigation_strategy="Mandatory certified stunt coordinator on set, dual redundancy harness rigs, and padded landing zones."
            ),
            RiskFlag(
                category="Weather & Location",
                severity="MEDIUM",
                description="Torrential wet-weather rain machine operations near heavy electrical equipment.",
                mitigation_strategy="IP67 waterproofed lighting rigs, ground fault circuit interrupters (GFCI), and heated holding tents for cast."
            ),
            RiskFlag(
                category="Technical / VFX",
                severity="MEDIUM",
                description="Complex holographic wrist deck compositing and drone laser tracking.",
                mitigation_strategy="On-set VFX supervisor tracking markers and pre-visualization camera tech-vis."
            ),
            RiskFlag(
                category="Budget Contingency",
                severity="LOW",
                description="Potential overtime fees for midnight exterior rooftop filming windows.",
                mitigation_strategy="Enforce 10-hour turnaround rules and lock secondary stage cover sets."
            )
        ]

        return ResourceForecastResult(
            total_budget_usd=total_budget,
            budget_tier=budget_tier,
            recommended_crew_size=crew_size,
            budget_breakdown=items,
            risk_matrix=risks
        )
