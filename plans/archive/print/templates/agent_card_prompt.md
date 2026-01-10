A nano-banana prompt for generating Agent Card artwork.

**Female Agent List:**

To ensure representation, the following cards should be generated with a female subject:
- Kite Jockey (Aviator)
- Navigator
- The Nob
- The Boffin
- Patent Clerk
- The Archives (Archivist)
- Cook's Man (Travel Agent)
- Aero Club
- Shop Steward
- Captain of Industry
- The Weatherman
- The Lab Coat

**Prompt Template:**

```
/generate --style="portrait, art deco, vintage illustration" --variations="color-palette" --ar 2:3 "text-free, no writing, no letters, no airplanes, no biplanes. A [GENDER] [ROLE] from the 1920s, [DESCRIPTION]. The background should be simple, unobtrusive, or feature airship-related elements only (e.g., a zeppelin in the distance, a mooring mast, the interior of a gondola). The portrait should be in a style reminiscent of vintage magazine illustrations, with a slightly desaturated color palette and a focus on the character's expression and attire. The final image must not contain any text, letters, or numbers, and absolutely no fixed-wing aircraft."
```

**Parameters:**

*   **`[GENDER]`**: The gender of the agent (e.g., male, female). Use the list above for guidance.
*   **`[ROLE]`**: The agent's job title (e.g., engineer, pilot, industrialist, navigator).
*   **`[DESCRIPTION]`**: A brief description of the agent's appearance or key features (e.g., "wearing aviator goggles and a leather jacket," "in a sharp pinstripe suit with a stern expression," "with drafting tools in their pocket").

**Example Usage (for a female 'Navigator'):**

```
/generate --style="portrait, art deco, vintage illustration" --variations="color-palette" --ar 2:3 "text-free, no writing, no letters, no airplanes, no biplanes. A female Navigator from the 1920s, using a sextant and looking intently at a celestial map inside an airship's gondola. The portrait should be in a style reminiscent of vintage magazine illustrations, with a slightly desaturated color palette. The final image must not contain any text, letters, or numbers, and absolutely no fixed-wing aircraft."
```

**Artistic Direction:**

*   **Theme:** All imagery must be strictly related to **airships (zeppelins, dirigibles)**. No fixed-wing aircraft should ever be depicted.
*   **Consistency:** The `art deco` and `vintage illustration` styles will provide a consistent look across all agent cards.
*   **Character Focus:** The prompt emphasizes a portrait style to highlight the personality of each agent.
*   **No Text:** The prompt is explicitly instructed to generate only the image, with no text, letters, or numbers.
