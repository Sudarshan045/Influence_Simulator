import heapq

def rank_ideas(data):
    # data = [(score, idea_id)]
    return heapq.nlargest(5, data)
