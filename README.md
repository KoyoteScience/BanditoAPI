# BanditoAPI

This is the core javascript client-side API library for Bandito API (see http://www.banditoapi.com/code_snippet_example.html for a live demonstration).

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
## Reference

### banditoAPI

**restart()**

Deletes training history of the given bandit and re-initializes all values.
```javascript
bandit.restart()
```

**pull**

Invocation:

```javascript
bandit.pull(
    feature_vectors,  // a list of lists containing the feature vectors to be scored
    model_type=null, //  one of ModelType available values
    predict_on_all_models=false,  // it takes longer to run predictions on all models in the ensemble, but it can be useful for obtaining propensities and distributions of model parameters
    model_index=null,  // should scoruing use a specific index in the probablistic ensemble?
    deterministic=false, // should scoring occur using a probabilistic model or on a deterministic one?
    attempt_restart=false // should an automatic restart occur when suggested by the API? (e.g., when the features change, or when an entry for the given model_id cannot be found)
)
```

Returns: 

The full payload from BanditoAPI, including the following fields. In general, these are only needed for debugging or advanced usage.

```javascript
payload = {
    alias, // staging or prod
    progress, // current training progress
    statusCode, // "200"
    headers, // headers for passing through CORS
    store_updated_model_response, // response from DynamoDB when storing updated model
    chosen_model_index, // the chosen model index from the probabilistic ensemble
    number_of_updates_for_chosen_model, 
    message, // "success" or "failure"
    min_count_to_skip_unknown_score, // how many times we need to sample a category before using the data distribution
    model_type_name, // one of ModelType allowed values
    prediction, // list-of-lists of predictions from all models (None's given if predict_on_all_models is set to false
    prediction_for_chosen_model, // list of prediction scores for the chosen probablistic model (or the deterministic model if deterministic is set to true)
    deterministic_prediction, // list of prediction scores for hte deterministic model
    chosen_action_index, // the chosen action index determined by the chosen model from the probabilistic ensemble (or the the deterministic model if deterministic is set to true)
    chosen_feature_vector, // feature vector for the chosen_action_index
    chosen_prediction_softmax, // softmax of the score for the chosen_action_index
    number_of_updates, // how many times this bandit has been trained
    did_we_update, // boolean for whether we have trained in this pull (should be false)
    map_model_index_to_updates, // object mapping the model index in the probabilistic ensemble to the number of training rows it has received
    ever_turn_off_training, // boolean for whether the passed feature vectors violated the feature_metadata
    bandit_mode, // "restart", "train", or "pull"
    model_parameters, // list-of-objects contain hyperparameters for each model in the probabilistic ensemble
    model_coefficients, // list-of-list of coefficients for all models in the probabilistic ensemble
    coefficients_for_chosen_model, // list of coefficients for the chosen model
    model_intercepts, // list of intercepts for all models in the probabilistic ensemble (if linear regression type)
    intercept_for_chosen_model, // float of intercept for chosen model (if linear regression type)
    deterministic_model_parameters, // hyperparameters for the deterministic model
    deterministic_model_coefficients, // list of coefficients for the deterministic model
    deterministic_model_intercept, // float of intercept for the deterministic model (if linear regression type)
    expanded_feature_names, // list of strings describing each feature element when categorical values are expanded
    expanded_feature_names_detailed, // list of objects describing each feature element when categorical values are expanded
    time_to_run_in_sec, // how long it took the job to run internally (not including network connections)
    map_feature_index_to_possible_value_to_list_map_model_index_to_prior_counts, // object mapping each categorical value to a list with an entry for each member of the probabilistic ensemble that contains an integer for the number of training rows for the deterministic model
    map_feature_index_to_possible_value_to_list_map_model_index_to_output_sums, // object mapping each categorical value to a list with an entry for each member of the probabilistic ensemble that contains the float sum of output values for training rows containing that categorical value
    map_feature_index_to_possible_value_to_prior_counts_for_chosen_model, // object mapping each categorical value to number of training rows for the model chosen from the probabilistic ensemble
    map_feature_index_to_possible_value_to_trailing_list_of_input_and_output_data,  // object mapping each categorical value to a trailing list of objects containing the input and output training vectors for the deterministic model
    map_feature_index_to_possible_value_to_prior_counts, // object mapping each categorical value to the integer number of training rows with that categorical value given to the deterministic model
    map_feature_index_to_possible_value_to_output_sums, // object mapping each categorical value to the float sum of output values for training rows with that categorical value given to the deterministic model
    map_feature_index_to_possible_value_to_output_sum_squares, // object mapping each categorical value to the float sum of squared output values for training rows with that categorical value given to the deterministic model
    map_feature_index_to_possible_value_to_prior_counts_trailing, // object mapping each categorical value to a list of integers for the index of training rows with that categorical value given to the deterministic model as returned by map_feature_index_to_possible_value_to_trailing_list_of_input_and_output_data
    map_feature_index_to_possible_value_to_output_sums_trailing, // object mapping each categorical value to the float sum of output values for training rows with that categorical value given to the deterministic model, but only for the trailing training rows in map_feature_index_to_possible_value_to_trailing_list_of_input_and_output_data
    map_feature_index_to_possible_value_to_output_sum_squares_trailing, // object mapping each categorical value to the float sum of squared output values for training rows with that categorical value given to the deterministic model, but only for the trailing training rows in map_feature_index_to_possible_value_to_trailing_list_of_input_and_output_data
    map_feature_index_to_possible_value_to_output_sums_for_chosen_model,  // object mapping each categorical value to the float sum of output values for training rows with that categorical value given to model chosen from the probabilistic ensemble
    map_feature_index_to_possible_value_to_output_sum_squares_for_chosen_model, // object mapping each categorical value to the float sum of squared output values for training rows with that categorical value given to model chosen from the probabilistic ensemble
    map_feature_index_to_input_sums, // object mapping each continuous feature element to the float sum of input values for training rows with that categorical value given to deterministic model
    map_feature_index_to_input_sum_squares, // object mapping each continuous feature element to the float sum of squared input values for training rows with that categorical value given to deterministic model
    output_sum, // float for the sum of output values in the training data that has been given to the deterministic model
    output_sum_squares, // float for the sum of squared output values in the training data that has been given to the deterministic model
    trailing_list_of_output_values, // list for the output values in the training data that has been given to the deterministic model, but only for the trailing set of training data
    trailing_list_of_feature_vectors, // list for the input feature vectors in the training data that has been given to the deterministic model, but only for the trailing set of training data
    list_map_input_vector_index_to_min_prior_count, // list of number of training rows that have been given to the deterministic model
    list_map_input_vector_index_to_min_prior_count_for_chosen_model,
    list_map_input_vector_index_to_feature_index_to_prior_counts,
    list_map_input_vector_index_to_model_index_to_min_prior_count,
    list_map_input_vector_index_to_model_index_to_whether_should_be_given_unknown_score,
    list_map_input_vector_index_to_whether_should_be_given_unknown_score,
    map_feature_index_to_possible_value_to_feature_index_to_possible_value_to_covariance,
    map_model_index_to_trailing_list_index_to_count
}
```

**train**

```javascript

```

**select**

```javascript

```
**select_with_automatic_restart**

```javascript

```
