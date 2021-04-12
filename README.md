# BanditoAPI

This is the core javascript client-side API library for Bandito API (see http://www.banditoapi.com/code_snippet_example.html for a live demonstration and https://github.com/KoyoteScience/red-pill-blue-pill for its source code).

## Example Usage in Javascript

### Slideshow Optimizer
```javascript

// Initialize
var api_key_for_bandito = '<CONTACT INFO@KOYOTESCIENCE.COM FOR AN API_KEY>'
var slides_to_consider = [
    'Slide 1', 'Slide 2', 'Slide 3', 'Slide 4', 'Slide 5'
]
var bandit = new slideshowOptimizer(
    api_key_for_bandito, 
    'app_id=code_snippet_example', 
    slides_to_consider
)

// Sort the slides
var slides_in_order = await bandit.sortSlides()

// Return a reward
var response = await bandit.bandit.trainMostRecentlySelectedSlide(
        selected_slide // or null
    )
```

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

## Example Usage in Python

### Headline Optimizer
```python

// Initialize
api_key_for_bandito = '<CONTACT INFO@KOYOTESCIENCE.COM FOR AN API_KEY>'
headlines_to_consider = [
    'Take the blue pill',
    'Take the red pill',
]
bandit = new headlineOptimizer(
    api_key_for_bandito, 
    'app_id=code_snippet_example', 
    headlines_to_consider
)

// Select a headline
selected_headline = bandit.selectHeadline()

// Return a reward
response = bandit.trainMostRecentlySelectedHeadline(reward)
```


### Standard
```python

// Initialize
api_key_for_bandito = '<CONTACT INFO@KOYOTESCIENCE.COM FOR AN API_KEY>'
headlines_to_consider = [
    'Take the blue pill',
    'Take the red pill',
]
feature_metadata = [{
    'name': 'text_to_choose',
    'categorical_or_continuous': 'categorical',
    'possible_values': headlines_to_consider
}]
feature_vectors = []
for headline in list_of_possible_headlines:
    feature_vectors.append([headline])

map_headline_to_reward = {
    'Take the blue pill': 1,
    'Take the red pill': 0,
}
model_id = 'app_id=code_snippet_example'
model_type = 'AverageCategoryMembership'
bandit = banditoAPI(
    api_key_for_bandito,
    model_id,
    feature_metadata,
    model_type
)

// Select an action
selected_action_index = bandit.select(feature_vectors)

// Return a reward
response = bandit.train(
    [feature_vectors[selected_action_index]], 
    [map_headline_to_reward[feature_vectors[selected_action_index]]]
)
```

## Reference

### Input Payloads

**Model Type**

There are four models that can be used with Bandito, identified by string. When training, Bandito updates interval variables for the exact models BayesianLinearRegression, TrainingBayesianLinearRegression, and AverageCategoryMembership. This means that even if you train with one of our bootstrapped model types (SGDRegressor is currently supported), you can always compare those results to the results from any of our exact model types at any time. For pulling, each model type has its pro's and con's, outlined below:

*Bootstrapped Models*
* SGDRegressor
  * A linear regression stochastic gradient descent regressor. This is a great solution for applications that will see a lot of data (quickly reaching 1000 training rows) where it is beneficial to "forget" old data. It trains quickly on large numbers of features.

*Exact Models*
* BayesianLinearRegression (default)
  * see https://github.com/KoyoteScience/BayesianLinearRegressor for details of its implementation)
  * A Bayesian linear regression with ridge regularization constant set to 1e-6. Extremely efficient for large numbers of training rows, but note that each update requires an order complexity of N^3 and storage N^2, where N is the number of continuous eatures and category values, so it is not suitable to problems with very large numbers of features (generally, where N^3 >> L where L is the number of training rows). This model does not "forget" old data.
* TrailingBayesianLinearRegression
  * A Bayesian linear regression with ridge regularization constant set to 1e-6, but only using the last N training rows, where N is set by the user (default N=100), along with a core set of the M most-recently visited trainng rows for each category value, where M is also set by the user (default M=5). This is an excellent solution when only the most recently used data is needed, or when you see noticeable drift in your data. Note that the core set of training is kept around since a user will often discount certain category values early on, and that information owuld otherwise be eliminated when cutting off the old data.
* AverageCategoryMembership
  * The simplest and easiest-to-debug model type, but also extremely versatile. This is only useful for features that are entirely encoded by category values. Basically, the historical performance of each category value is averaged together. This model type learns extremely quickly and communicates easily with the user, and in the case of one categorical feature, is equivalent to a "model free" bandit in the literature.

**Feature Metadata**

This is an object requiring the following fields:

* name
  * a string identifying the feature
* categorical_or_continuous
  * takes one of two values: cateogrical or continuous. Determines whether we have a discrete feature with possible values, or a float.
* possible values (only if categorical_or_continuous=='categorical')
  * a list of values that the feature can assume; any feature vectors that are passed that don't contain one of these values will be ignored.
* min_value / max_value (only if categorical_or_continuous=='continuous')
  * a float for the minimum or maximum value that the continuous float feature can assume; any feature vectors that are passed with this feature exceeding these limits will be ignored; null values mean that these limits will be ignored and all data will be accepted

**Output Metadata**

By default, we assume that the output is a continuous floating point with no limits, but this can be changed.

* min_value / max_value
  * a float for the minimum or maximum value that the continuous float feature can assume; any feature vectors that are passed with this feature exceeding these limits will be ignored

### banditoAPI()

Invocation:

```javascript
bandit = banditoAPI(
     api_key=null,
        // API key for accessing bandito
     model_id=null,
        // string identifying the unique model or bandit
     feature_metadata=null,
        // object containing metadata about the feature vectors (for more information, see below)
     model_type='LinearAlgebraLinearRegression',
        // string, one of ModelType
     predict_on_all_models=false,
        // boolean for whether to run predictions on all models in the probabilistic ensemble (useful for debugging)
     feature_vectors=null,
        // a list of lists of feature vectors to always pull on, if you don't want to pass them in every pull
)
```

Returns:

banditoAPI class instance

### restart()

Deletes training history of the given bandit and re-initializes all values.

Invocation: 

```javascript
bandit.restart()
```

Returns: 

null

### select()

Selects a feature vector from a given list according to the bandit.

Invocation (same as pull, except that feature_vectors can be omitted if it was passed during instantiation):

```javascript
bandit.pull(
    feature_vectors=null,  
        // a list of lists containing the feature vectors to be scored
    model_type=null, 
        // string, one of ModelType
    predict_on_all_models=false,  
        // it takes longer to run predictions on all models in the ensemble, but it can be useful for obtaining propensities and distributions of model parameters
    model_index=null,  
        // should scoruing use a specific index in the probablistic ensemble?
    deterministic=false, 
        // should scoring occur using a probabilistic model or on a deterministic one?
    attempt_restart=false 
        // should an automatic restart occur when suggested by the API? (e.g., when the features change, or when an entry for the given model_id cannot be found)
)
```

Returns:

Integer fo the index from feature_vectors that was selected.

### select_with_automatic_restart()

Selects a feature vector from a given list according to the bandit, but also restarts the bandit during certain circumstanes:
* When the given model_id has never been encountered before
* When the feature_metadata or output_metadata has changed (thus invalidating the current bandit results)

Invocation (same as select):

```javascript
bandit.pull(
    feature_vectors=null,  
        // a list of lists containing the feature vectors to be scored
    model_type=null, 
        // string, one of ModelType
    predict_on_all_models=false,  
        // it takes longer to run predictions on all models in the ensemble, but it can be useful for obtaining propensities and distributions of model parameters
    model_index=null,   
        // should scoruing use a specific index in the probablistic ensemble?
    deterministic=false, 
        // should scoring occur using a probabilistic model or on a deterministic one?
    attempt_restart=false 
        // should an automatic restart occur when suggested by the API? (e.g., when the features change, or when an entry for the given model_id cannot be found)
)
```

Returns:

Integer fo the index from feature_vectors that was selected.

### pull()

Invocation (same as s:

```javascript
bandit.pull(
    feature_vectors,  
        // a list of lists containing the feature vectors to be scored
    model_type=null, 
        // string, one of ModelType
    predict_on_all_models=false,  
        // it takes longer to run predictions on all models in the ensemble, but it can be useful for obtaining propensities and distributions of model parameters
    model_index=null,  
        // should scoruing use a specific index in the probablistic ensemble?
    deterministic=false, 
        // should scoring occur using a probabilistic model or on a deterministic one?
    attempt_restart=false 
        // should an automatic restart occur when suggested by the API? (e.g., when the features change, or when an entry for the given model_id cannot be found)
)
```

Returns: 

The full payload from BanditoAPI as described below. In general, this payload is only needed for debugging or advanced usage.

### train()

Invocation:

```javascript
bandit.train(
    feature_vectors,
        // list-of-lists of feature vectors to train on, can also be a single list containing one feature vector
    output_values
        // list of float output values to train on, can also be a single float containing one output value
)
```

Returns:

The full payload from BanditoAPI as described below. In general, this payload is only needed for debugging or advanced usage.

### Return Payloads

Both **train** and **pull** return the following payload, which is only needed for debugging or advanced usage.:

```javascript
payload = {
    alias, 
        // staging or prod
    progress, 
        // current training progress
    statusCode, 
        // "200"
    headers, 
        // headers for passing through CORS
    store_updated_model_response, 
        // response from DynamoDB when storing updated model
    chosen_model_index, 
        // the chosen model index from the probabilistic ensemble
    number_of_updates_for_chosen_model, 
        // integer number of training rows given to the model chosen from the probabilistic ensemble
    message, 
        // "success" or "failure"
    min_count_to_skip_unknown_score, 
        // how many times we need to sample a category before using the data distribution
    model_type_name, 
        // one of ModelType allowed values
    prediction, 
        // list-of-lists of predictions from all models (None's given if predict_on_all_models is set to false
    prediction_for_chosen_model, 
        // list of prediction scores for the chosen probablistic model (or the deterministic model if deterministic is set to true)
    deterministic_prediction, 
        // list of prediction scores for hte deterministic model
    chosen_action_index, 
        // the chosen action index determined by the chosen model from the probabilistic ensemble (or the the deterministic model if deterministic is set to true)
    chosen_feature_vector, 
        // feature vector for the chosen_action_index
    chosen_prediction_softmax, 
        // softmax of the score for the chosen_action_index
    number_of_updates, 
        // how many times this bandit has been trained
    did_we_update, 
        // boolean for whether we have trained in this pull (should be false)
    map_model_index_to_updates, 
        // object mapping the model index in the probabilistic ensemble to the number of training rows it has received
    ever_turn_off_training, 
        // boolean for whether the passed feature vectors violated the feature_metadata
    bandit_mode, 
        // "restart", "train", or "pull"
    model_parameters, 
        // list-of-objects contain hyperparameters for each model in the probabilistic ensemble
    model_coefficients, 
        // list-of-list of coefficients for all models in the probabilistic ensemble
    coefficients_for_chosen_model, 
        // list of coefficients for the chosen model
    model_intercepts, 
        // list of intercepts for all models in the probabilistic ensemble (if linear regression type)
    intercept_for_chosen_model, 
        // float of intercept for chosen model (if linear regression type)
    deterministic_model_parameters, 
        // hyperparameters for the deterministic model
    deterministic_model_coefficients, 
        // list of coefficients for the deterministic model
    deterministic_model_intercept, 
        // float of intercept for the deterministic model (if linear regression type)
    expanded_feature_names, 
        // list of strings describing each feature element when categorical values are expanded
    expanded_feature_names_detailed, 
        // list of objects describing each feature element when categorical values are expanded
    time_to_run_in_sec, 
        // how long it took the job to run internally (not including network connections)
    map_feature_index_to_possible_value_to_list_map_model_index_to_prior_counts, 
        // object mapping each categorical value to a list with an entry for each member of the probabilistic ensemble that contains an integer for the number of training rows for the deterministic model
    map_feature_index_to_possible_value_to_list_map_model_index_to_output_sums, 
        // object mapping each categorical value to a list with an entry for each member of the probabilistic ensemble that contains the float sum of output values for training rows containing that categorical value
    map_feature_index_to_possible_value_to_prior_counts_for_chosen_model, 
        // object mapping each categorical value to number of training rows for the model chosen from the probabilistic ensemble
    map_feature_index_to_possible_value_to_trailing_list_of_input_and_output_data,  
        // object mapping each categorical value to a trailing list of objects containing the input and output training vectors for the deterministic model
    map_feature_index_to_possible_value_to_prior_counts, 
        // object mapping each categorical value to the integer number of training rows with that categorical value given to the deterministic model
    map_feature_index_to_possible_value_to_output_sums, 
        // object mapping each categorical value to the float sum of output values for training rows with that categorical value given to the deterministic model
    map_feature_index_to_possible_value_to_output_sum_squares, 
        // object mapping each categorical value to the float sum of squared output values for training rows with that categorical value given to the deterministic model
    map_feature_index_to_possible_value_to_prior_counts_trailing, 
        // object mapping each categorical value to a list of integers for the index of training rows with that categorical value given to the deterministic model as returned by map_feature_index_to_possible_value_to_trailing_list_of_input_and_output_data
    map_feature_index_to_possible_value_to_output_sums_trailing, 
        // object mapping each categorical value to the float sum of output values for training rows with that categorical value given to the deterministic model, but only for the trailing training rows in map_feature_index_to_possible_value_to_trailing_list_of_input_and_output_data
    map_feature_index_to_possible_value_to_output_sum_squares_trailing, 
        // object mapping each categorical value to the float sum of squared output values for training rows with that categorical value given to the deterministic model, but only for the trailing training rows in map_feature_index_to_possible_value_to_trailing_list_of_input_and_output_data
    map_feature_index_to_possible_value_to_output_sums_for_chosen_model,  
        // object mapping each categorical value to the float sum of output values for training rows with that categorical value given to model chosen from the probabilistic ensemble
    map_feature_index_to_possible_value_to_output_sum_squares_for_chosen_model, 
        // object mapping each categorical value to the float sum of squared output values for training rows with that categorical value given to model chosen from the probabilistic ensemble
    map_feature_index_to_input_sums, 
        // object mapping each continuous feature element to the float sum of input values for training rows with that categorical value given to deterministic model
    map_feature_index_to_input_sum_squares, 
        // object mapping each continuous feature element to the float sum of squared input values for training rows with that categorical value given to deterministic model
    output_sum, 
        // float for the sum of output values in the training data that has been given to the deterministic model
    output_sum_squares, 
        // float for the sum of squared output values in the training data that has been given to the deterministic model
    trailing_list_of_output_values, 
        // list for the output values in the training data that has been given to the deterministic model, but only for the trailing set of training data
    trailing_list_of_feature_vectors, 
        // list for the input feature vectors in the training data that has been given to the deterministic model, but only for the trailing set of training data
    list_map_input_vector_index_to_min_prior_count, 
        // list mapping each input vector of minimum number of training rows that have been given to the deterministic model that share the same categorical values in the input vector
    list_map_input_vector_index_to_min_prior_count_for_chosen_model,
        // list mapping each input vector to the minimum number of prior training rows given to the deterministic model containing any of the categorical values for the given input vector
    list_map_input_vector_index_to_feature_index_to_prior_counts,
        // list of lists mapping the input vector index to a list mapping each entry in the input feature vector to the number of prior training rows given to the deterministic model containing the same categorical value
    list_map_input_vector_index_to_model_index_to_min_prior_count,
        // list of lists mapping the input vector index to a list mapping each model of the probabilistic ensemble to the minimum number of prior training rows given to the deterministic model that share the same categorical values in the input vector
    list_map_input_vector_index_to_model_index_to_whether_should_be_given_unknown_score, 
        // list of lists mapping the input vector index to a list of model indexes containing a boolean determined by whether the input vector has been flagged by that model to be explored (flagged for unknown)
    list_map_input_vector_index_to_whether_should_be_given_unknown_score,
        // list mapping the input vector index to a boolean determined by whether the input vector has been flagged by the deterministic model to be explored (flagged for unknown)
    map_feature_index_to_possible_value_to_feature_index_to_possible_value_to_covariance,
        // the covariance matrix, in object form
    map_model_index_to_trailing_list_index_to_count
        // list of lists mapping the model index from the probabilistic ensemble to the index of the trailing rows in map_feature_index_to_possible_value_to_trailing_list_of_input_and_output_data to the number of times that training row was added to that model in the probabilistic ensemble
    covariance_matrix
        // covariance matrix of the input and output values
    moment_matrix
        // moment matrix of the input and output values, that is, given Z = np.hstack([X, y]), the moment matrix is Z.T @ Z (in numpy notation)
    residual_sum_squares
        // sum of squared residuals for the deterministic version of BayesianLinearRegression, which is always updated even when training on another model type
}
```

