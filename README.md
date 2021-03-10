# BanditoAPI

This is the core javascript client-side API library for Bandito API (see http://www.banditoapi.com/code_snippet_example.html).

## Example Usage

### Headline Optimizer
```javascript

// Initialize
var api_key_for_bandito = '<CONTACT INFO@KOYOTESCIENCE.COM FOR AN API_KEY>'
var headlines_to_consider = [
    'Take the blue pill',
    'Take the red pill',
]
var bandit = new headlineOptimizer(
    api_key_for_bandito, 
    'app_id=code_snippet_example', 
    headlines_to_consider
)

// Select a headline
var selected_headline = await bandit.selectHeadline()

// Return a reward
var response = await bandit.trainMostRecentlySelectedHeadline(
        reward
    )
```


### Standard
```javascript

// Initialize
var api_key_for_bandito = '<CONTACT INFO@KOYOTESCIENCE.COM FOR AN API_KEY>'
var headlines_to_consider = [
    'Take the blue pill',
    'Take the red pill',
]
var feature_metadata = [{
    'name': 'text_to_choose',
    'categorical_or_continuous': 'categorical',
    'possible_values': headlines_to_consider
}]
var feature_vectors = []
for (var headline of list_of_possible_headlines) {
    feature_vectors.push([headline])
}
var map_headline_to_reward = {
    'Take the blue pill': 1,
    'Take the red pill': 0,
}
var model_id = 'app_id=code_snippet_example'
// options include CovarianceLinearRegression, LinearAlgebraLinearRegression, AverageCategoryMembership
var model_type = 'AverageCategoryMembership'
var bandit = banditoAPI(
    api_key_for_bandito,
    model_id,
    feature_metadata,
    model_type
)

// Select an action
var selected_action_index = await bandit.select(feature_vectors)

// Return a reward
var response = await bandit.train(
        [feature_vectors[selected_action_index]], 
        [map_headline_to_reward[feature_vectors[selected_action_index]]]
    )
```
