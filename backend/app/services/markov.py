import random

transition_matrix = {
    "Birth": {"Growth": 0.8, "Decline": 0.2},
    "Growth": {"Peak": 0.7, "Decline": 0.3},
    "Peak": {"Decline": 0.6, "Revival": 0.4},
    "Decline": {"Revival": 0.5, "Death": 0.5},
    "Revival": {"Growth": 1.0}
}

def next_state(current_state):
    transitions = transition_matrix.get(current_state, {})
    rand = random.random()
    cumulative = 0

    for state, prob in transitions.items():
        cumulative += prob
        if rand <= cumulative:
            return state

    return current_state
