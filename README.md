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
var action_feature_metadata = [{
    'name': 'text_to_choose',
    'categorical_or_continuous': 'categorical',
    'possible_values': headlines_to_consider
}]
var context_feature_metadata = []
var output_metadata = {
    'linear_logistic_or_categorical': 'logistic'
}
var action_feature_vectors = []
for (var headline of list_of_possible_headlines) {
    feature_vectors.push([headline])
}
var map_headline_to_reward = {
    'Take the blue pill': 1,
    'Take the red pill': 0,
}
var model_id = 'app_id=code_snippet_example'
var model_type_name = 'EmpiricalRegressor'
var bandit = banditoAPI(
    api_key_for_bandito,
    model_id,
    action_feature_metadata,
    context_feature_metadata,
    output_metadata,
    model_type_name
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
action_feature_metadata = [{
    'name': 'text_to_choose',
    'categorical_or_continuous': 'categorical',
    'possible_values': headlines_to_consider
}]
output_metadata = {
    'linear_logistic_or_categorical': 'logistic'
}
feature_vectors = []
for headline in list_of_possible_headlines:
    feature_vectors.append([headline])

map_headline_to_reward = {
    'Take the blue pill': 1,
    'Take the red pill': 0,
}
model_id = 'app_id=code_snippet_example'
model_type_name = 'EmpiricalRegressor'
bandit = banditoAPI(
    api_key=api_key_for_bandito,
    model_id=model_id,
    action_feature_metadata=action_feature_metadata,
    output_metadata=output_metadata,
    model_type_name=model_type_name
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
* BayesLinearRegressor (default)
  * see https://github.com/KoyoteScience/BayesianLinearRegressor for details of its implementation)
  * A Bayesian linear regression with ridge regularization constant set to 1e-6. Extremely efficient for large numbers of training rows, but note that each update requires an order complexity of N^3 and storage N^2, where N is the number of continuous eatures and category values, so it is not suitable to problems with very large numbers of features (generally, where N^3 >> L where L is the number of training rows). This model does not "forget" old data.
* TrailingBayesLinearRegressor
  * A Bayesian linear regression with ridge regularization constant set to 1e-6, but only using the last N training rows, where N is set by the user (default N=100), along with a core set of the M most-recently visited trainng rows for each category value, where M is also set by the user (default M=5). This is an excellent solution when only the most recently used data is needed, or when you see noticeable drift in your data. Note that the core set of training is kept around since a user will often discount certain category values early on, and that information would otherwise be eliminated when cutting off the old data.
* EmpiricalRegressor
  * The simplest and easiest-to-debug model type, but also extremely versatile. This is only useful for features that are entirely encoded by category values. Basically, the historical performance of each category value is averaged together, with Bayesian component coming from sampling the means of the related Beta distributions. This model type learns extremely quickly and communicates easily with the user, and in the case of one categorical feature (which could be the concatenation of all categorical features), is equivalent to a "model free" bandit in the literature.

**Action Feature Metadata**

This is an object requiring the following fields:

* name
  * a string identifying the feature
* categorical_or_continuous
  * takes one of two values: cateogrical or continuous. Determines whether we have a discrete feature with possible values, or a float.
* possible values (only if categorical_or_continuous=='categorical')
  * a list of values that the feature can assume; any feature vectors that are passed that don't contain one of these values will be ignored.
* min_value / max_value (only if categorical_or_continuous=='continuous')
  * a float for the minimum or maximum value that the continuous float feature can assume; any feature vectors that are passed with this feature exceeding these limits will be ignored; null values mean that these limits will be ignored and all data will be accepted

**Context Feature Metadata**

Same as Action Feature Metadata, but for the context features, which don't change from action to action, but do change from pull to pull.

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
     action_feature_metadata=null,
        // object containing metadata about the action feature vectors (for more information, see below)
     context_feature_metadata=null,
        // object containing metadata about the context_feature vectors (for more information, see below)
     output_metadata=null,
        // object containing metadata about the output values (for more information, see below)
     model_type_name='BayesLinearRegressor',
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
    action_feature_vectors=null,  
        // a list of lists containing the action feature vectors to be scored
    context_feature_vector=null,  
        // a list of lists containing the context feature vector to be scored
    model_type_name=null, 
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
    action_feature_vectors=null,  
        // a list of lists containing the action feature vectors to be scored
    context_feature_vector=null,  
        // a list of lists containing the context feature vector to be scored
    model_type_name=null, 
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
    action_feature_vectors=null,  
        // a list of lists containing the action feature vectors to be scored
    context_feature_vector=null,  
        // a list of lists containing the context feature vector to be scored
    model_type_name=null, 
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
    action_feature_vector,
        // action feature vector to train on
    context_feature_vector,
        // context feature vector to train on
    output_value
        // float output values to train on
)
```

Returns:

The full payload from BanditoAPI as described below. In general, this payload is only needed for debugging or advanced usage.

### Return Payloads

Methods **train**, **pull**, and **select** return the following payload, which is only needed for debugging or advanced usage.:

```javascript
payload = {
        'bandit_metadata',
            // object containing app, user and model id's
        'progress',
            // fractional progress towards exploring categorical features with low amounts of training data
        'propensity',
            // propensity of the selection, used for inverse-weighting of training, None for train and pull modes
        'model_store_size_in_kb'
            //
        'statusCode',
            // "200"
        'headers',
            // headers for passing through CORS
        'alias',
            // staging or prod
        'store_updated_model_response',
            // response from DynamoDB when storing updated model
        'number_of_updates_for_chosen_model',
            // if a bootstrap regressor is used (i.e., SGDRegressor), this gives us the number of training rows it has receivedn, None for train and pull modes
        'chosen_action_index',
            // the action index chosen, None for train and pull modes
        'chosen_bootstrap_index',
            // if a bootstrap regressor is used (i.e., SGDRegressor), this gives us the index of the model used, None for train and pull modes
        'message',
            // 'success
        'min_count_to_skip_unknown_score',
            // how many times we need to sample a category before using the data distribution
        'model_type_name',
            // one of ModelType allowed values
        'prediction',
            // prediction scores for each action feature vector, None for train mode
        'should_we_assign_unknown_score_by_action_index',
            // list of booleans one for each action feature vector, saying whether it should be explored
        'number_of_updates',
            // total number of training rows thusfar process
        'bandit_mode',
            // the method used
        'time_to_run_in_sec',
            // internal time to run entire process
        'minimum_number_of_updates_needed',
            // number of updates needed to get a non-null result
        'should_we_return_complete_payload'
            // boolean for whether to return the complete payload
        'min_count_to_skip_unknown_score', 
            // how many times we need to sample a category before using the data distribution
}
```

If you pass True to **should_we_return_complete_payload** you also receive these items, along with the entire payload that was passed in:

```javascript
    
    'prediction_for_chosen_model', 
        // list of prediction scores for the chosen probablistic model (or the deterministic model if deterministic is set to true)
    'prediction_for_deterministic_model', 
        // list of prediction scores for the deterministic model
    'chosen_feature_vector', 
        // feature vector for the chosen_action_index
    'prediction_distribution_by_action_index',
        // list-of-lists of predictions for each action index, only populated when predict_on_all_models==True
    'chosen_action_feature_vector',
        // action feature vector for the selected action index, None for pull and train
    'chosen_feature_vector',
        // action feature vector concatenated with context feature vector for the selected action index, None for pull and train
    'updates_by_model_index',
        // for the bootstrap regressor, how many updates each bootstrapped model has received
    'model_coefficients',
        // list of coefficients for the model used to make predictions
    'model_intercept,
        // float of intercept for the model used to make predictions
    'model_coefficient_summary_statistics',
        // list of objects for each coefficient including average, standard deviation, and count when predict_on_all_models==True
    'model_intercept_summary_statistics',
        // object including average, standard deviation, and count when predict_on_all_models==True
    'coefficient_distribution',
        // list of lists, indexed first by coefficient and second by prediction model sample, giving a full distribution of coefficients
    'intercept_distribution'',
        // list indexed by prediction model sample, giving a full distribution of the intercept
    'coefficients_for_deterministic_model',
        // same as model_coefficients, but for the deterministic model
    'intercept_for_deterministic_model',
        // same as model_intercept, but for the deterministic model
    'residual_sum_squares',
        // sum of squared residuals for the deterministic version of BayesianLinearRegression, which is always updated even when training on another model type
    'trailing_list_of_output_values',
        // list of output values stored, limited by trailing_list_length
    'trailing_list_of_processed_feature_vectors',
        // list of expanded feature vectors values stored, limited by trailing_list_length
    'covariance_matrix',
        // covariance matrix of the data
    'moment_matrix',
        // moment matrix of the data
    'list_of_feature_names_detailed', 
        // list of objects describing each feature element when categorical values are expanded
    'list_of_feature_names',
        // list of strings describing each feature element when categorical values are expanded
    'empirical_regressor_coefficients',
        // list of average output values for each time a given feature value is non-zero (for the expanded feature vector)
    
    // Training data summaries
    
    'output_sum',
        // float for the sum of output values in the training data that has been given to the deterministic model
    'output_sum_squares',
        // float for the sum of squared output values in the training data that has been given to the deterministic model
    'prior_counts_by_feature_index',
        // list of integers for how many times a feature index has had a non zero value (for the expanded feature vector)
    'prior_counts_by_action_index_by_feature_index',
        // list of integers for how many times a feature index has had a non zero value (for the raw feature vector)
    'output_sums_by_feature_index',
        // list of floats of output sums for each feature index when its value is not zero (for the expanded feature vector)
    'input_sums_by_feature_index',
        // list of floats of input sums for each feature index when its value is not zero (for the expanded feature vector)
    'min_prior_counts_by_action_index',
        // minimum of prior_counts_by_action_index_by_feature_index for each action index
        
```

