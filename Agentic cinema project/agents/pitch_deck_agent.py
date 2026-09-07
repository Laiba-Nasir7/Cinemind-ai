from .base_agent import BaseGeminiAgent
from .schemas import ScriptBreakdownResult, ResourceForecastResult, ExecutivePitchResult

class PitchDeckAgent(BaseGeminiAgent):
    """
    Sub-Agent 4: Executive Pitch & Market Intelligence Agent
    Synthesizes narrative, visual, and financial data into greenlight executive pitch reports.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        super().__init__(agent_name="Executive Pitch Agent", model_name=model_name)

    def generate_pitch(
        self,
        breakdown: ScriptBreakdownResult,
        forecast: ResourceForecastResult,
        visual_style: str = "Cyberpunk Neo-Noir",
        script_doctor_prompt: str = ""
    ) -> ExecutivePitchResult:
        doctor_section = f"\n\nScript Doctor Tone & Commercial Strategy:\n\"{script_doctor_prompt}\"\n" if script_doctor_prompt.strip() else ""

        prompt = f"""You are a Studio Head of Production and Senior Film Executive at a major Hollywood distribution studio.
Synthesize the provided script breakdown, budget forecast, and visual style ({visual_style}) into a high-octane commercial pitch deck summary.{doctor_section}

Title: {breakdown.script_title}
Genre: {breakdown.genre}
Visual Aesthetic: {visual_style}
Estimated Budget: ${forecast.total_budget_usd:,.2f} ({forecast.budget_tier})
Scenes: {breakdown.total_scenes}
Key Characters: {', '.join([c.name for c in breakdown.characters])}

Instructions:
1. Formulate a commercial, high-concept 1-2 sentence Logline.
2. Provide a gripping 1-paragraph story Synopsis.
3. List 3 comparable box-office hits (Comps).
4. Identify primary target audience demographic & streaming/theatrical market positioning.
5. Write a compelling Executive Summary convincing investors and studio greenlight committees why this film will deliver strong ROI and global festival/box-office appeal.
"""

        def fallback_factory() -> ExecutivePitchResult:
            return self._build_deterministic_pitch(breakdown, forecast, visual_style, script_doctor_prompt)

        return self.generate_structured(
            prompt=prompt,
            response_schema=ExecutivePitchResult,
            fallback_data_factory=fallback_factory
        )

    def _build_deterministic_pitch(
        self,
        breakdown: ScriptBreakdownResult,
        forecast: ResourceForecastResult,
        visual_style: str = "Cyberpunk Neo-Noir",
        doctor_prompt: str = ""
    ) -> ExecutivePitchResult:
        """Deterministic pitch deck fallback."""
        title = breakdown.script_title.upper()

        if "NEON" in title or "CYBER" in title:
            logline = "When an anti-gravity heist goes wrong inside a torrential Neo-Tokyo vault, an elite netrunner and a heavy mercenary must hack their way out before antimatter lockdown destroys the city."
            comps = ["Blade Runner 2049", "The Matrix", "Ocean's Eleven"]
            demographic = "Gen-Z & Millennials (Ages 18-38), Sci-Fi/Cyberpunk Fans, Action & Tech Enthusiasts"
            positioning = "High-concept theatrical sci-fi thriller with massive global IMAX & international SVOD appeal."
        elif "VENICE" in title or "NOIR" in title:
            logline = "A worn detective hunting an art assassin through midnight Venetian fog uncovers a living portrait predicting his own murder."
            comps = ["Se7en", "Knives Out", "The Girl with the Dragon Tattoo"]
            demographic = "Adult Cinema Enthusiasts (Ages 25-54), Mystery & Crime Fiction Audiences"
            positioning = "Prestigious autumn festival entry (Venice/TIFF) targeting strong PVOD ancillary revenue."
        elif "DRAGON" in title or "FANTASY" in title:
            logline = "As an icy blizzard besieges the last mountain fortress, a scarred commander and an archmage stand against ten thousand ash-corrupted warriors."
            comps = ["The Lord of the Rings", "Game of Thrones", "300"]
            demographic = "Broad Global Fantasy Audience (Ages 16-45), Gaming & Action Franchise Fans"
            positioning = "Tentpole blockbuster release with multi-platform transmedia potential (Gaming, Merchandise)."
        else:
            logline = "An isolated audio archivist listening to deep-sea sound recordings uncovers a temporal frequency warning him of a killer outside his window."
            comps = ["Ex Machina", "A Quiet Place", "Arrival"]
            demographic = "Independent Cinema & Psychological Thriller Fans (Ages 21-49)"
            positioning = "High-margin indie thriller featuring low overhead and massive festival breakout capability."

        synopsis = (
            f"Set against the backdrop of {breakdown.scenes[0].slugline if breakdown.scenes else 'an intense atmospheric setting'}, "
            f"'{breakdown.script_title}' follows {', '.join([c.name for c in breakdown.characters[:2]])} in an escalating race against time. "
            f"Combining raw emotional stakes with high-voltage visual setpieces, the narrative delivers a gripping cinematic experience."
        )

        executive_summary = (
            f"'{breakdown.script_title}' represents an exceptional commercial opportunity. With a projected production budget of "
            f"${forecast.total_budget_usd:,.2f} ({forecast.budget_tier}), the project achieves high visual value per dollar spent. "
            f"Supported by structured safety protocols and clear market positioning, this title is positioned for strong greenlight approval."
        )

        return ExecutivePitchResult(
            logline=logline,
            synopsis=synopsis,
            comparable_films=comps,
            target_demographic=demographic,
            market_positioning=positioning,
            executive_summary=executive_summary
        )
