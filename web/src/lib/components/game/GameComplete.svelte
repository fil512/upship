<script lang="ts">
	import { goto } from '$app/navigation';
	import { gameState, gameWinner, gameScores, allPlayers } from '$lib/stores/gameState';
	import Icon from '$lib/components/ui/Icon.svelte';

	// Get sorted players by score
	$: sortedPlayers = $gameScores
		? Object.entries($gameScores)
				.map(([playerId, score]) => ({
					playerId,
					...score,
					playerState: $gameState?.players[playerId]
				}))
				.sort((a, b) => b.total - a.total)
		: [];

	$: winnerFaction = $gameWinner && $gameState?.players[$gameWinner]?.faction;

	function handleBackToLobby() {
		goto('/');
	}

	// Get medal emoji based on rank
	function getMedal(rank: number): string {
		switch (rank) {
			case 0:
				return '🥇';
			case 1:
				return '🥈';
			case 2:
				return '🥉';
			default:
				return `${rank + 1}.`;
		}
	}

	// Capitalize faction name
	function capitalize(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
</script>

<div class="game-complete-overlay">
	<div class="game-complete-modal">
		<div class="trophy-section">
			<div class="trophy">🏆</div>
			<h1>Game Complete!</h1>
			{#if winnerFaction}
				<h2 class="winner-announcement">
					<span class="winner-faction {winnerFaction}">{capitalize(winnerFaction)}</span> Wins!
				</h2>
			{/if}
		</div>

		<div class="final-standings">
			<h3>Final Standings</h3>
			<table class="standings-table">
				<thead>
					<tr>
						<th>Rank</th>
						<th>Faction</th>
						<th>VP</th>
						<th>Routes</th>
						<th>Tech</th>
						<th>Previous</th>
					</tr>
				</thead>
				<tbody>
					{#each sortedPlayers as player, i}
						<tr class:winner={player.playerId === $gameWinner}>
							<td class="rank">{getMedal(i)}</td>
							<td class="faction {player.faction}">
								<Icon name={player.faction} size={20} />
								{capitalize(player.faction)}
								{#if player.playerState?.isBot}
									<span class="bot-tag">BOT</span>
								{/if}
							</td>
							<td class="vp">{player.total}</td>
							<td>{player.breakdown.routes}</td>
							<td>{player.breakdown.techCards}</td>
							<td>{player.breakdown.previouslyAccumulated}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="game-stats">
			<div class="stat">
				<span class="stat-label">Age</span>
				<span class="stat-value">{$gameState?.age}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Rounds</span>
				<span class="stat-value">{$gameState?.round}</span>
			</div>
		</div>

		<button class="back-to-lobby-btn" on:click={handleBackToLobby}>
			Back to Lobby
		</button>
	</div>
</div>

<style>
	.game-complete-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.game-complete-modal {
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
		border: 2px solid #d4af37;
		border-radius: 16px;
		padding: 2rem 3rem;
		max-width: 600px;
		width: 90%;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212, 175, 55, 0.2);
		animation: slideUp 0.4s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(30px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.trophy-section {
		margin-bottom: 1.5rem;
	}

	.trophy {
		font-size: 4rem;
		margin-bottom: 0.5rem;
		animation: bounce 1s ease infinite;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	h1 {
		color: #d4af37;
		font-size: 2rem;
		margin: 0 0 0.5rem 0;
		text-shadow: 0 2px 10px rgba(212, 175, 55, 0.3);
	}

	.winner-announcement {
		font-size: 1.5rem;
		color: #fff;
		margin: 0;
	}

	.winner-faction {
		font-weight: bold;
	}

	.winner-faction.germany {
		color: #ffcc00;
	}
	.winner-faction.britain {
		color: #ff6b6b;
	}
	.winner-faction.usa {
		color: #4dabf7;
	}
	.winner-faction.italy {
		color: #69db7c;
	}

	.final-standings {
		margin: 1.5rem 0;
	}

	.final-standings h3 {
		color: #aaa;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 2px;
		margin-bottom: 1rem;
	}

	.standings-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.95rem;
	}

	.standings-table th {
		color: #888;
		font-weight: normal;
		text-transform: uppercase;
		font-size: 0.75rem;
		letter-spacing: 1px;
		padding: 0.5rem;
		border-bottom: 1px solid #333;
	}

	.standings-table td {
		padding: 0.75rem 0.5rem;
		border-bottom: 1px solid #222;
		color: #ccc;
	}

	.standings-table tr.winner td {
		background: rgba(212, 175, 55, 0.1);
		color: #fff;
	}

	.rank {
		font-size: 1.2rem;
	}

	.faction {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
	}

	.faction.germany {
		color: #ffcc00;
	}
	.faction.britain {
		color: #ff6b6b;
	}
	.faction.usa {
		color: #4dabf7;
	}
	.faction.italy {
		color: #69db7c;
	}

	.bot-tag {
		font-size: 0.65rem;
		background: #444;
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
		color: #999;
	}

	.vp {
		font-size: 1.3rem;
		font-weight: bold;
		color: #d4af37;
	}

	.game-stats {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin: 1.5rem 0;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: bold;
		color: #fff;
	}

	.back-to-lobby-btn {
		background: linear-gradient(135deg, #d4af37 0%, #b8942e 100%);
		color: #000;
		border: none;
		padding: 0.75rem 2rem;
		font-size: 1rem;
		font-weight: bold;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-to-lobby-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
	}

	.back-to-lobby-btn:active {
		transform: translateY(0);
	}
</style>
