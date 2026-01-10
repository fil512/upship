A nano-banana prompt for generating Hazard Card artwork.

**Prompt Template:**

```
/generate --style="dramatic, vintage illustration, atmospheric" --ar 2:3 "text-free, no writing, no letters, no airplanes, no biplanes. A dramatic and atmospheric scene depicting an airship encountering a [HAZARD_TYPE] hazard: [HAZARD_NAME]. The scene shows [SCENE_DESCRIPTION]. The style should be reminiscent of early 20th-century adventure illustrations or vintage aviation art, with a focus on the danger and the scale of the elements. The final image must not contain any legible text, letters, or numbers, and absolutely no fixed-wing aircraft."
```

**Parameters:**

*   **`[HAZARD_TYPE]`**: The type of hazard (e.g., Weather, Mechanical, Fire, Clear Weather).
*   **`[HAZARD_NAME]`**: The specific name of the hazard card (e.g., "Squall Line," "Engine Fire," "Low Visibility").
*   **`[SCENE_DESCRIPTION]`**: A brief description of the situation (e.g., "an airship battered by dark storm clouds and lightning," "smoke billowing from an engine nacelle," "an airship sailing calmly through blue skies").

**Example Usage (for 'Squall Line'):**

```
/generate --style="dramatic, vintage illustration, atmospheric" --ar 2:3 "text-free, no writing, no letters, no airplanes, no biplanes. A dramatic and atmospheric scene depicting an airship encountering a Weather hazard: Squall Line. The scene shows an airship battered by a massive, dark wall of storm clouds and violent winds. The style should be reminiscent of early 20th-century adventure illustrations or vintage aviation art. The final image must not contain any legible text, letters, or numbers, and absolutely no fixed-wing aircraft."
```

**Artistic Direction:**

*   **Theme:** Focus on the *hazard* itself and its effect on the airship.
*   **Atmosphere:** Should range from calm/beautiful (for Clear Weather) to intense/terrifying (for Major/Fire hazards).
*   **Style:** Consistent with the era—think pulp adventure covers or period technical illustrations of accidents.
*   **No Text:** The prompt is explicitly instructed to generate only the image, with no text, letters, or numbers.
