from typing import List
from .base_agent import BaseGeminiAgent
from .schemas import ScriptBreakdownResult, VisualStoryboardResult, ShotPrompt

class VisualStoryboardAgent(BaseGeminiAgent):
    """
    Sub-Agent 3: Visual Storyboard & Cinematography Agent
    Translates scene action into shot lists, camera specs, lighting palettes, and AI prompts.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        super().__init__(agent_name="Visual Storyboard Agent", model_name=model_name)

    def generate_storyboard(self, breakdown: ScriptBreakdownResult, visual_style: str = "Cyberpunk Neo-Noir", script_doctor_prompt: str = "") -> VisualStoryboardResult:
        doctor_section = f"\n\nScript Doctor Tone & Visual Adjustment:\n\"{script_doctor_prompt}\"\n" if script_doctor_prompt.strip() else ""

        prompt = f"""You are an award-winning Director of Photography (DP) and Visual Effects Art Director.
Based on the following film breakdown, generate a shot-by-shot visual storyboard plan with camera mechanics, lighting palettes, and generative AI image prompts matching the target visual aesthetic style.

Script Title: {breakdown.script_title}
Genre: {breakdown.genre}
Target Visual Aesthetic: {visual_style}{doctor_section}
Scenes:
{chr(10).join([f"Scene {s.scene_number}: {s.slugline} - Mood: {s.emotional_tone}" for s in breakdown.scenes])}

Instructions:
1. Define the overall cinematic visual style matching '{visual_style}'.
2. Provide a 4-color HEX palette matching the requested aesthetic.
3. For each major scene, generate key camera shots (Wide, Medium Push-in, Low Angle, Extreme Close-Up) with precise camera movement, lighting palette, and a production-grade Generative AI image prompt (formatted for Imagen 3 / Midjourney v6).
"""

        def fallback_factory() -> VisualStoryboardResult:
            return self._build_deterministic_storyboard(breakdown, visual_style, script_doctor_prompt)

        return self.generate_structured(
            prompt=prompt,
            response_schema=VisualStoryboardResult,
            fallback_data_factory=fallback_factory
        )

    def _build_deterministic_storyboard(self, breakdown: ScriptBreakdownResult, visual_style: str = "Cyberpunk Neo-Noir", doctor_prompt: str = "") -> VisualStoryboardResult:
        """Deterministic storyboard generator fallback."""
        v_upper = visual_style.upper()

        if "NOIR" in v_upper and "VINTAGE" in v_upper:
            style = "Vintage Film Noir, Chiaroscuro high-contrast black and white shadows, 35mm film grain, Venetian blinds rim light."
            palette = ["#F8FAFC", "#94A3B8", "#1E293B", "#020617"]
        elif "WATERCOLOR" in v_upper or "CONCEPT" in v_upper:
            style = "Impressionistic Watercolor Concept Art, fluid pastel color washes, soft expressive brushstrokes, ethereal dreamlike lighting."
            palette = ["#F472B6", "#38BDF8", "#FDE047", "#1E1B4B"]
        elif "GRAPHIC" in v_upper or "ANIME" in v_upper:
            style = "Stylized Graphic Novel / Cel-shaded Anime Aesthetic, bold ink outline linework, vibrant pop-art cell coloring, dramatic dynamic speedlines."
            palette = ["#EF4444", "#F59E0B", "#10B981", "#1E1E2E"]
        elif "PHOTOREALISTIC" in v_upper or "IMAX" in v_upper or "35MM" in v_upper:
            style = "Photorealistic 70mm IMAX Cinematography, naturalistic golden hour lighting, razor-sharp Hasselblad detail, organic film grain."
            palette = ["#EAB308", "#0EA5E9", "#15803D", "#0F172A"]
        else:
            style = "Cyberpunk Neo-Noir, Anamorphic 35mm lens flares, drenched obsidian textures, teal and crimson volumetric light rays."
            palette = ["#00F2FE", "#FF007F", "#0A0E17", "#FFB000"]

        shots = []
        shot_counter = 1

        for scene in breakdown.scenes:
            # Shot A: Establishing Wide
            shots.append(
                ShotPrompt(
                    shot_number=shot_counter,
                    scene_number=scene.scene_number,
                    shot_type="Wide Establishing Shot",
                    camera_movement="High-Angle Crane Down / Slow Drone Push",
                    lighting_palette="Volumetric Rain Flares & Neon Cyan Rim Light",
                    genai_image_prompt=f"Cinematic wide establishing shot of {scene.slugline}, {style}, 8k resolution, photorealistic film grain, ARRI Alexa 35 --ar 16:9 --style raw",
                    description=f"Wide view of {scene.location_name} establishing environmental scale and mood."
                )
            )
            shot_counter += 1

            # Shot B: Action / Character Shot
            char_name = scene.characters_present[0] if scene.characters_present else "OPERATIVE"
            shots.append(
                ShotPrompt(
                    shot_number=shot_counter,
                    scene_number=scene.scene_number,
                    shot_type="Low-Angle Medium Push-In",
                    camera_movement="Steadicam Push-In on Subject",
                    lighting_palette="Chiaroscuro Shadow Split & Glowing visor highlights",
                    genai_image_prompt=f"Cinematic medium low-angle shot of {char_name} in {scene.slugline}, intense expression, holding {', '.join(scene.props_required[:1])}, {style}, shallow depth of field --ar 16:9",
                    description=f"Medium tracking shot focusing on {char_name} reacting to escalating tension."
                )
            )
            shot_counter += 1

            # Shot C: Extreme Close-up / Climax
            if len(shots) < 8:
                shots.append(
                    ShotPrompt(
                        shot_number=shot_counter,
                        scene_number=scene.scene_number,
                        shot_type="Extreme Close-Up (Macro)",
                        camera_movement="Static Tight Macro Focus",
                        lighting_palette="High-Contrast Pulse & Spark Reflections",
                        genai_image_prompt=f"Extreme close up macro shot of prop device and eyes reflecting sparks, intense detail, {style}, panavision anamorphic lens --ar 16:9",
                        description="Macro detail shot highlighting key prop activation or emotional climax."
                    )
                )
                shot_counter += 1

        return VisualStoryboardResult(
            cinematic_style=style,
            color_palette_hex=palette,
            shots=shots[:8]
        )
