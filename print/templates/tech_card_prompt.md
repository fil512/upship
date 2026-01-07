
A nano-banana prompt for generating Tech Card artwork.

**Prompt Template:**

```
/generate --style="blueprint, schematic, technical drawing" --ar 4:3 "text-free, no writing, no letters, no airplanes, no biplanes. A detailed blueprint schematic of an airship component: [TECHNOLOGY_NAME] from the early 20th century. The image should be in the style of a vintage engineering diagram, with clean lines and purely decorative, non-readable annotations that look like squiggles. The background should resemble aged sepia-toned grid paper. The final image must not contain any legible text, letters, or numbers, and absolutely no fixed-wing aircraft."
```

**Parameters:**

*   **`[TECHNOLOGY_NAME]`**: The name of the technology (e.g., "Daimler Petrol Engine," "Geodetic Structure," "Goldbeater's Skin").

**Example Usage (for the 'Duralumin Frame' card):**

```
/generate --style="blueprint, schematic, technical drawing" --ar 4:3 "text-free, no writing, no letters, no airplanes, no biplanes. A detailed blueprint schematic of a Duralumin Frame for an airship from the early 20th century. The image should be in the style of a vintage engineering diagram, showing the lattice structure and connection points, with clean lines and purely decorative, non-readable annotations that look like squiggles. The background should resemble aged sepia-toned grid paper. The final image must not contain any legible text, letters, or numbers, and absolutely no fixed-wing aircraft."
```

**Artistic Direction:**

*   **Theme:** All imagery must be strictly related to **airships (zeppelins, dirigibles)**. No fixed-wing aircraft should ever be depicted.
*   **Consistency:** The `blueprint`, `schematic`, and `technical drawing` styles will create a cohesive look for all tech cards, distinct from the agent portraits.
*   **Technical Focus:** The prompt focuses on the object itself, emphasizing its design and function.
*   **No Text:** The prompt is explicitly instructed to generate only the image with purely decorative, non-legible annotations.
