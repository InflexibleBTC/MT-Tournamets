let offset = 0;
let limit = 40;
let searchActive = false;
let intervalId = null;
let highlightedPlayer = null;
let globalSortOrder = 'desc';
async function loadTournaments() {
    const selectElement = document.getElementById('tournamentSelect');
    const response = await fetch('/api/tournaments');
    const data = await response.json();
    data.data.forEach(tournament => {
        const option = document.createElement('option');
        option.value = tournament.id;
        option.textContent = tournament.name;
        selectElement.appendChild(option);
    });

    selectElement.addEventListener('select', () => {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        const selectedTournamentName = selectedOption.textContent;
        const selectedTournamentId = selectedOption.value;
        updateTournamentTitle(selectedTournamentName);
        loadTournamentResults(selectedTournamentId);
    });

    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const selectedTournamentName = selectedOption.textContent;
    updateTournamentTitle(selectedTournamentName);
}

function updateTournamentTitle(tournamentName) {
    const tournamentTitle = document.querySelector('.widget h2');
    if (tournamentName === 'Выберите турнир') {
        tournamentTitle.textContent = '';
    } else {
        tournamentTitle.textContent = `Результаты по турниру: ${tournamentName}. Данные обновляются каждые 5 секунд.`;
    }
}

async function loadTournamentResults(tournamentId) {
    if (!tournamentId) return;
    clearInterval(intervalId);
    document.getElementById('loader').style.display = 'block';
    document.getElementById('content').style.display = 'none';
    offset = 0;
    limit = 40;
    await fetchData(offset, limit, true, tournamentId);
    intervalId = setInterval(() => {
        if (!searchActive) {
            fetchData(offset, limit, true, tournamentId);
        }
    }, 5000);
}

async function fetchData(offset, limit, clearTable = true, tournamentId) {
			try {
				const response = await fetch(`/api/tournament/${tournamentId}?offset=${offset}&limit=${limit}`);

				if (!response.ok) {
					throw new Error('Произошла ошибка загрузки турнира, скорее всего турнир закончился ' + response.statusText);
				}

				const responseData = await response.json();

				let players = responseData.data.participants;


				if (players.length < 1) {
					document.getElementById('loadMoreBtn').disabled = true;
					document.getElementById('loadMoreBtn2').disabled = true;
				} else {
					document.getElementById('loadMoreBtn').disabled = false;
					document.getElementById('loadMoreBtn2').disabled = false;
				}

				const tournamentCreatedAt = new Date(responseData.data.created_at);
				const formattedDateCreated_at = tournamentCreatedAt.toLocaleDateString('ru-RU');
				const formattedTimeCreated_at = tournamentCreatedAt.toLocaleTimeString('ru-RU');
				const formattedDateTimeCreated_at = `${formattedDateCreated_at} ${formattedTimeCreated_at}`;

				const tournamentFinishedAt = new Date(responseData.data.finished_at);
				const formattedDateFinished_at = tournamentFinishedAt.toLocaleDateString('ru-RU');
				const formattedTimeFinished_at = tournamentFinishedAt.toLocaleTimeString('ru-RU');
				const formattedDateTimeFinished_at = `${formattedDateFinished_at} ${formattedTimeFinished_at}`;

				document.getElementById('created_at').innerText = formattedDateTimeCreated_at;
				document.getElementById('finished_at').innerText = formattedDateTimeFinished_at;
				document.getElementById('description').innerText = responseData.data.description;
				document.getElementById('participantsCount').innerText = responseData.data.participants_count;

				if (players && Array.isArray(players)) {
					const playersBody = document.getElementById('playersBody');

					if (clearTable) {
						playersBody.innerHTML = '';
					}

					players.forEach(player => {
						if (globalSortOrder === 'asc') {
							player.results.history.sort((a, b) => a - b);
						} else {
							player.results.history.sort((a, b) => b - a);
						}

						const playerUpdatedAt = new Date(player.updated_at);
						playerUpdatedAt.setHours(playerUpdatedAt.getHours() + 3);
						const formattedDate = playerUpdatedAt.toLocaleDateString('ru-RU');
						const formattedTime = playerUpdatedAt.toLocaleTimeString('ru-RU');
						const formattedDateTime = `${formattedDate} ${formattedTime}`;
						const tr = document.createElement('tr');
						const maxBattle = player.results.max;

						function getPlayerPrize(position) {
						  const prizes = responseData.data.prizes_ranges;
						  let prizeDescription = '-';

						  for (let i = 0; i < prizes.length; i++) {
							const current = prizes[i];
							const next = prizes[i + 1] || { place: Infinity };

							if (position === current.place || (position > current.place && position < next.place)) {
							  prizeDescription = current.description || `${current.prize} золота`;
							  break;
							}
						  }

						  return prizeDescription;
						}

						const prizeDescription = getPlayerPrize(player.position);


						const percent_wins = isNaN(player.results.wins / player.results.battles) ? '0%' : Math.round((player.results.wins / player.results.battles) * 100) + '%';
						tr.innerHTML = `
						<td class="player-updated_at">${formattedDateTime}</td>
						<td class="player-position">${player.position}</td>
						<td>
							<img src="https://challenge.tanki.su/static/media/reward-gold.0989732c4fb50531ecec.webp" alt="Gold Icon">
							${prizeDescription}
						</td>
						<td class="player-name">
                                <a href="https://tanki.su/ru/community/accounts/${player.user.spa_id}-${player.user.name}/" target="_blank" rel="noopener noreferrer">
                                    ${player.user.name}
                                </a>
                        </td>
						<td>${player.results.battles}</td>
						<td>${player.results.wins}</td>
						<td>${percent_wins}</td>
						<td class="player-total">${player.results.total}
						<div class="best-battle-info" >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="2em" height="2em" fill="currentColor"><path d="M9.669.864 8 0 6.331.864l-1.858.282-.842 1.68-1.337 1.32L2.6 6l-.306 1.854 1.337 1.32.842 1.68 1.858.282L8 12l1.669-.864 1.858-.282.842-1.68 1.337-1.32L13.4 6l.306-1.854-1.337-1.32-.842-1.68L9.669.864zm1.196 1.193.684 1.365 1.086 1.072L12.387 6l.248 1.506-1.086 1.072-.684 1.365-1.51.229L8 10.874l-1.355-.702-1.51-.229-.684-1.365-1.086-1.072L3.614 6l-.25-1.506 1.087-1.072.684-1.365 1.51-.229L8 1.126l1.356.702 1.509.229z"></path><path d="M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1 4 11.794z"></path></svg>
							<div class="tooltip">
								<p>Лучший бой</p>
								<p>Опыт: ${maxBattle}</p>
							</div>
						</div>
						</td>
						<td class="player-history" data-sort-order="${globalSortOrder}">
							<span>${player.results.history.join(', ')}</span>
						</td>
						<td>${player.results.max}</td>
						<td>${player.results.avg.toFixed(2)}</td>
					`;
						playersBody.appendChild(tr);

					if (player.position === 1) {
						tr.querySelector('.player-position').classList.add('gold-position');
					} else if (player.position === 2) {
						tr.querySelector('.player-position').classList.add('silver-position');
					} else if (player.position === 3) {
						tr.querySelector('.player-position').classList.add('bronze-position');
					}

						if (highlightedPlayer && player.user.name.toLowerCase() === highlightedPlayer.toLowerCase()) {
							tr.classList.add('highlight');
							setTimeout(() => {
								tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
							}, 500);
						}
					});

					document.getElementById('loader').style.display = 'none';
					document.getElementById('content').style.display = 'block';

					document.getElementById('prevBtn').disabled = offset === 0;
					document.getElementById('prevBtn2').disabled = offset === 0;
				} else {
					throw new Error('Unexpected data structure');
				}
			} catch (error) {
				document.getElementById('loader').textContent = 'Турнир отсутствует';
				console.error('Ошибка загрузки данных: ', error);
			}
		}

        async function loadMore() {
			const nextBtn = document.getElementById('loadMoreBtn');
			if (nextBtn.disabled) return;
			offset += limit;
			const selectedOption = document.getElementById('tournamentSelect').value;
			fetchData(offset, limit, true, selectedOption);
		}

		function prevPage() {
			if (offset >= limit) {
				offset -= limit;
				const selectedOption = document.getElementById('tournamentSelect').value;
				fetchData(offset, limit, true, selectedOption);
			}
		}

		async function search() {
			const searchInput = document.getElementById('searchInput').value;
			if (searchInput) {
				document.getElementById('loader').textContent = 'Поиск игрока...';
				searchActive = true;
				highlightedPlayer = searchInput;
				clearInterval(intervalId);
				document.getElementById('loader').style.display = 'block';
				document.getElementById('content').style.display = 'none';
				offset = 0;
				limit = 40;
				const selectedOption = document.getElementById('tournamentSelect').value;
				const result = await searchPlayerByName(searchInput, offset, limit, selectedOption);
				if (!result) {
					alert('Пользователь не найден.');
				} else {
					offset = result.offset;
					limit = result.limit;
				}
				searchActive = false;
				fetchData(offset, limit, true, selectedOption);
			}
		}

		function sortColumn(columnName) {
			if (globalSortOrder === 'desc') {
				globalSortOrder = 'asc';
			} else {
				globalSortOrder = 'desc';
			}
			const sortArrow = document.querySelector('.sort-arrow');
			if (globalSortOrder === 'asc') {
				sortArrow.classList.remove('down');
				sortArrow.classList.add('up');
			} else {
				sortArrow.classList.remove('up');
				sortArrow.classList.add('down');
			}
			const selectedOption = document.getElementById('tournamentSelect').value;
			fetchData(offset, limit, true, selectedOption);
		}

		async function searchPlayerByName(name, offset, limit, tournamentId) {
		const url = `https://challenge.tanki.su/api/v1/tournaments/${tournamentId}?offset=${offset}&limit=${limit}&langru&column=rating`;
		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error('Произошла ошибка загрузки данных, возможно, турнир закончился: ' + response.statusText);
			}

			const responseData = await response.json();
			const players = responseData.data.participants;

			if (players && Array.isArray(players)) {
				const foundPlayer = players.find(player => player.user.name.toLowerCase() === name.toLowerCase());

				if (foundPlayer) {
					document.getElementById('loader').style.display = 'none';
					document.getElementById('content').style.display = 'block';
					await fetchData(offset, limit, true, tournamentId);
					return { offset, limit };
				} else if (players.length === limit) {
					return await searchPlayerByName(name, offset + limit, limit, tournamentId);
				} else {
					return false;
				}
			} else {
				throw new Error('Ошибка парсинга данных');
			}
		} catch (error) {
			document.getElementById('loader').textContent = 'Ошибка загрузки данных.';
			console.error('Ошибка загрузки данных: ', error);
			return false;
		}
	}

    async function initialize() {
			await loadTournaments();
		}

		initialize();

		const loadMoreBtn = document.getElementById('loadMoreBtn');
		const prevBtn = document.getElementById('prevBtn');
		const searchBtn = document.getElementById('searchBtn');

		const loadMoreBtn2 = document.getElementById('loadMoreBtn2');
		const prevBtn2 = document.getElementById('prevBtn2');

		loadMoreBtn.addEventListener('click', loadMore);
		prevBtn.addEventListener('click', prevPage);

		loadMoreBtn2.addEventListener('click', loadMore);
		prevBtn2.addEventListener('click', prevPage);

		searchBtn.addEventListener('click', search);

		window.addEventListener('beforeunload', () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		});