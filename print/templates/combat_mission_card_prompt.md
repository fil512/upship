A nano-banana prompt for generating Combat Mission Card artwork.

**Prompt Template:**

```
/generate --style="vintage war poster, lithograph, dramatic" --ar 4:3 "text-free, no writing, no letters, no airplanes, no biplanes. A dramatic scene depicting a World War I era airship on a [MISSION_TYPE] mission: [MISSION_NAME]. The scene shows [SCENE_DESCRIPTION]. The style should be reminiscent of 1910s war art or lithographs, with muted earth tones, grey skies, and a gritty atmosphere. The focus is on the scale and majesty of the airship amidst the conflict. The final image must not contain any legible text, letters, or numbers, and absolutely no fixed-wing aircraft."
```

**Parameters:**

*   **`[MISSION_TYPE]`**: The type of mission (e.g., Bombing Run, Reconnaissance, Resupply, Naval Patrol, Artillery Observation).
*   **`[MISSION_NAME]`**: The specific name of the mission card (e.g., "Factory Strike," "Deep Reconnaissance," "Submarine Hunter").
*   **`[SCENE_DESCRIPTION]`**: A brief description of the action (e.g., "dropping bombs on a distant factory complex," "flying high above enemy trenches," "lowering crates to soldiers on the ground").

**Example Usage (for 'Submarine Hunter'):**

```
/generate --style="vintage war poster, lithograph, dramatic" --ar 4:3 "text-free, no writing, no letters, no airplanes, no biplanes. A dramatic scene depicting a World War I era airship on a Naval Patrol mission: Submarine Hunter. The scene shows a massive Zeppelin hovering over a dark, choppy sea, searching for the silhouette of a submarine beneath the waves. The style should be reminiscent of 1910s war art or lithographs, with muted earth tones, grey skies, and a gritty atmosphere. The final image must not contain any legible text, letters, or numbers, and absolutely no fixed-wing aircraft."
```

**Artistic Direction:**

*   **Theme:** All imagery must be strictly related to **airships (zeppelins, dirigibles)** during WWI. No fixed-wing aircraft (biplanes, triplanes) should be depicted.
*   **Consistency:** The `vintage war poster` and `lithograph` styles will distinguish these cards from the schematic tech cards and portrait agent cards, reflecting the conflict of Age II.
*   **Atmosphere:** Focus on the scale, drama, and sometimes somber tone of the Great War.
*   **No Text:** The prompt is explicitly instructed to generate only the image, with no text, letters, or numbers.
