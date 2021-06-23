export default class banditoAPI {

    toString() {
        return 'banditoAPI instance with model_id: ' + this.model_id
    }

    constructor(
        api_key = null,
        model_id = null,
        action_feature_metadata = null,
        context_feature_metadata = null,
        output_metadata = null,
        model_type_name = 'MomentLinearRegression',
        predict_on_all_models = false,
        action_feature_vectors = null,
        bandit_metadata = null
    ) {
        if (context_feature_metadata == null) {
            context_feature_metadata = []
        }
        this.api_key = api_key
        this.url = 'https://akn4hgmvuc.execute-api.us-west-2.amazonaws.com/staging/'
        this.model_id = model_id
        this.action_feature_metadata = action_feature_metadata
        this.context_feature_metadata = context_feature_metadata
        this.model_type_name = model_type_name
        this.predict_on_all_models = predict_on_all_models
        this.action_feature_vectors = action_feature_vectors
        this.most_recent_restart_response = null
        this.most_recent_pull_response = null
        this.most_recent_train_response = null
        this.most_recent_response = null
        this.progress = null
        this.bandit_metadata = bandit_metadata
        this.most_recently_ranked_feature_vectors = null
        this.most_recently_pulled_prediction_scores = null
        this.most_recently_pulled_feature_vectors = null
        this.output_metadata = output_metadata
    }

    async restart() {

        var payload = {
            'model_id': this.model_id,
            'model_type_name': this.model_type_name,
            'bandit_mode': 'restart',
            'predict_on_all_models': this.predict_on_all_models,
            'action_feature_metadata': this.action_feature_metadata,
            'context_feature_metadata': this.context_feature_metadata,
            'output_metadata': this.output_metadata,
            'bandit_metadata': this.bandit_metadata
        }

        // Simple POST request with a JSON body using fetch
        var requestOptions = {
            method: 'POST',
            headers: {
                'x-api-key': this.api_key
            },
            body: JSON.stringify({
                payload: payload
            })
        };

        const response = await fetch(this.url, requestOptions).then(val => {
            return val.json()
        }).catch(
            err => {
                return {'errorMessage': 'Failure during fetch in javascript: ' + err.toString(), err: err}
            }
        );

        if (Object.keys(response).includes('body')) {
            response.body = JSON.parse(response.body)
        } else if (Object.keys(response).includes('alias')) {
            response.body = {...response}
        } else {
            debugger
            response.body.success = false
            return response.body
        }

        this.most_recent_train_response = response.body
        this.most_recent_response = response.body
        response.body.success = true
        return response.body
    }

    async pull(
        action_feature_vectors,
        context_feature_vector = null,
        model_type_name = null,
        predict_on_all_models = false,
        model_index = null,
        deterministic = false,
        attempt_restart = false,
        return_complete_payload_and_debug = false,
    ) {

        if (model_type_name == null) {
            var model_type_name = this.model_type_name
        } else {
            var model_type_name = model_type_name
        }

        if (context_feature_vector === null) {
            context_feature_vector = []
        }

        var payload = {
            'model_id': this.model_id,
            'model_type_name': model_type_name,
            'bandit_mode': 'pull',
            'predict_on_all_models': true,
            'action_feature_metadata': this.action_feature_metadata,
            'context_feature_metadata': this.context_feature_metadata,
            'output_metadata': this.output_metadata,
            'action_feature_vectors': action_feature_vectors,
            'context_feature_vector': context_feature_vector,
            'model_index': model_index,
            'bandit_metadata': this.bandit_metadata,
            'deterministic': deterministic,
            'should_we_return_complete_payload': return_complete_payload_and_debug
        }

        // Simple POST request with a JSON body using fetch
        var requestOptions = {
            method: 'POST',
            headers: {
                'x-api-key': this.api_key
            },
            body: JSON.stringify({
                payload: payload
            })
        };

        var response = await fetch(this.url, requestOptions).then(val => {
            return val.json()
        }).catch(
            err => {
                return {'errorMessage': 'Failure during fetch in javascript: ' + err.toString(), err: err}
            }
        );

        if (Object.keys(response).includes('body')) {
            response.body = JSON.parse(response.body)
        } else if (Object.keys(response).includes('alias')) {
            response.body = {...response}
        } else {
            if (attempt_restart && Object.keys(response).includes('errorMessage') && response.errorMessage.includes("We recommend a restart")) {

                var restart_resonse = await this.restart()
                var time1 = Math.round(new Date().getTime())
                var response = await fetch(this.url, requestOptions).then(val => {
                    return val.json()
                }).catch(
                    err => {
                        return {'errorMessage': 'Failure during fetch in javascript: ' + err.toString(), err: err}
                    }
                );
                if (Object.keys(response).includes('body')) {
                    response.body = JSON.parse(response.body)
                } else if (Object.keys(response).includes('alias')) {
                    response.body = {...response}
                } else {
                    response.body = {}
                    response.body.success = false
                    return response.body
                }
            } else {
                debugger
                response.body.success = false
                return response.body
            }
        }

        if (deterministic) {
            response.body['prediction'] = response.body['prediction_for_deterministic_model']
            response.body['coefficients_for_chosen_model'] = response.body['deterministic_model_coefficients']
            response.body['intercept_for_chosen_model'] = response.body['deterministic_model_intercept']
        }

        // get feature_vector sorted from highest prediction to lowest
        var predictions_with_unknown_scores_given_random_large_values = response.body.prediction.slice()
        for (var prediction_index = 0; prediction_index < predictions_with_unknown_scores_given_random_large_values; prediction_index++) {
            if (response.body.prediction[prediction_index] == null) {
                // give it a random value that is at least as large as the largest numerical value
                predictions_with_unknown_scores_given_random_large_values[prediction_index] = Math.random() + Math.max(...response.body.prediction) + 1
            }
        }
        var sorted_action_feature_vectors = action_feature_vectors.slice()
        sorted_action_feature_vectors.sort(function (b, a) {
            return predictions_with_unknown_scores_given_random_large_values.indexOf(a) -
                predictions_with_unknown_scores_given_random_large_values.indexOf(b);
        });

        this.most_recent_pull_response = response.body
        this.most_recent_response = response.body
        this.progress = response.body.progress
        this.most_recently_ranked_action_feature_vectors = sorted_action_feature_vectors
        this.most_recently_pulled_prediction_scores = response.body.prediction
        this.most_recently_pulled_feature_vectors = action_feature_vectors

        if (return_complete_payload_and_debug) {
            debugger
        }
        response.body.success = true
        return response.body
    }

    async train(action_feature_vector, context_feature_vector, output_value) {
        var payload = {
            'model_id': this.model_id,
            'model_type_name': 'EmpiricalRegressor',  // TODO: This currently just overwrites, and should be settable
            'bandit_mode': 'train',
            'action_feature_metadata': this.action_feature_metadata,
            'context_feature_metadata': this.context_feature_metadata,
            'output_metadata': this.output_metadata,
            'action_feature_vectors': [action_feature_vector],
            'context_feature_vector': context_feature_vector,
            'output_value': output_value,
            'timestamp_of_payload_creation': (new Date().getTime()),
            'bandit_metadata': this.bandit_metadata
        }

        // Simple POST request with a JSON body using fetch
        var requestOptions = {
            method: 'POST',
            headers: {
                'x-api-key': this.api_key
            },
            body: JSON.stringify({
                payload: payload
            })
        };

        const response = await fetch(this.url, requestOptions).then(val => {
            return val.json()
        }).catch(
            err => {
                return {'errorMessage': 'Failure during fetch in javascript: ' + err.toString(), err: err}
            }
        );

        if (Object.keys(response).includes('body')) {
            response.body = JSON.parse(response.body)
        } else if (Object.keys(response).includes('alias')) {
            response.body = {...response}
        } else {
            try {
                response.body.success = true
                response.body
            } catch {
                console.dir(response)
                1 / 0
            }
        }

        this.most_recent_train_response = response.body
        this.most_recent_response = response.body
        this.progress = response.body.progress
        response.body.success = true
        return response.body
    }

    async rank(
        action_feature_vectors = null,
        context_feature_vector = null,
        model_type_name = null,
        predict_on_all_models = false,
        model_index = null,
        deterministic = false,
        attempt_restart = false
    ) {
        if (action_feature_vectors == null || action_feature_vectors == undefined) {
            action_feature_vectors = this.action_feature_vectors
        }
        if (context_feature_vector == null) {
            context_feature_vector = []
        }
        var pull_reponse = await this.pull(action_feature_vectors, context_feature_vector, model_type_name, predict_on_all_models, model_index, deterministic, attempt_restart)
        return this.most_recently_ranked_feature_vectors
    }

    async rank_with_automatic_restart(
        action_feature_vectors = null,
        context_feature_vectors = null,
        model_type_name = null,
        predict_on_all_models = false,
        model_index = null,
        deterministic = false
    ) {
        await this.pull(action_feature_vectors, context_feature_vector, model_type_name, predict_on_all_models, model_index, deterministic, attempt_restart)
        return this.most_recent_pull_response['chosen_action_index']
    }

    async select(action_feature_vectors = null, context_feature_vector = null, model_type_name = null, predict_on_all_models = false, model_index = null, deterministic = false, attempt_restart = false) {
        if (action_feature_vectors == null || action_feature_vectors == undefined) {
            action_feature_vectors = this.action_feature_vectors
        }
        if (context_feature_vector == null) {
            context_feature_vector = []
        }
        await this.pull(action_feature_vectors, context_feature_vector, model_type_name, predict_on_all_models, model_index, deterministic, attempt_restart)
        return this.most_recent_pull_response['chosen_action_index']
    }

    async select_with_automatic_restart(action_feature_vectors = null, context_feature_vector = null, model_type_name = null, predict_on_all_models = false, model_index = null, deterministic = false) {
        return await this.select(action_feature_vectors, context_feature_vector, model_type_name, predict_on_all_models, model_index, deterministic, true)
    }
}


export class headlineOptimizer extends banditoAPI {

    constructor(api_key, model_id, list_of_possible_headlines, bandit_metadata = null) {

        var action_feature_metadata = [{
            'name': 'text_to_choose',
            'categorical_or_continuous': 'categorical',
            'possible_values': list_of_possible_headlines
        }]

        var output_metadata = {
            'linear_logistic_or_categorical': 'logistic'
        }
        var action_feature_vectors = []
        for (var headline of list_of_possible_headlines) {
            action_feature_vectors.push([headline])
        }
        var context_feature_vector = []
        var context_feature_metadata = []

        var internal_bandit_metadata = {
            'model_id': model_id,
            'model_type_name': 'EmpiricalRegressor',
            'action_feature_vectors': action_feature_vectors,
            'action_feature_metadata': action_feature_metadata,
            'output_metadata': output_metadata,
            'predict_on_all_models': false
        }

        super(
            api_key,
            internal_bandit_metadata.model_id,
            internal_bandit_metadata.action_feature_metadata,
            internal_bandit_metadata.context_feature_metadata,
            internal_bandit_metadata.output_metadata,
            internal_bandit_metadata.model_type_name,
            internal_bandit_metadata.predict_on_all_models,
            internal_bandit_metadata.action_feature_vectors,
            bandit_metadata
        )
        this.most_recently_selected_headline = null

    }

    async selectHeadline() {
        var action_index = await this.select_with_automatic_restart(
            this.action_feature_vectors,
            this.context_feature_vector,
            this.model_type_name
        )
        this.most_recently_selected_headline = this.action_feature_vectors[action_index][0]
        return this.action_feature_vectors[action_index][0]
    }

    async trainMostRecentlySelectedHeadline(reward) {
        return this.train([this.most_recently_selected_headline], [], [reward])
    }
}


export class slideshowOptimizer extends banditoAPI {

    constructor(api_key, model_id, list_of_possible_slides, bandit_metadata = null) {

        var action_feature_metadata = [{
            'name': 'slide_name',
            'categorical_or_continuous': 'categorical',
            'possible_values': list_of_possible_slides
        }]

        var output_metadata = {
            'linear_logistic_or_categorical': 'logistic'
        }
        var action_feature_vectors = []
        for (var slide of list_of_possible_slides) {
            action_feature_vectors.push([slide])
        }
        var context_feature_vector = []
        var context_feature_metadata = []

        var internal_bandit_metadata = {
            'model_id': model_id,
            'model_type_name': 'EmpiricalRegressor',
            'action_feature_vectors': action_feature_vectors,
            'action_feature_metadata': action_feature_metadata,
            'output_metadata': output_metadata,
            'predict_on_all_models': false
        }

        super(
            api_key,
            internal_bandit_metadata.model_id,
            internal_bandit_metadata.action_feature_metadata,
            internal_bandit_metadata.context_feature_metadata,
            internal_bandit_metadata.output_metadata,
            internal_bandit_metadata.model_type_name,
            internal_bandit_metadata.predict_on_all_models,
            internal_bandit_metadata.action_feature_vectors,
            bandit_metadata
        )
        this.most_recently_selected_headline = null

    }

    async sortSlides() {
        await this.rank_with_automatic_restart(
            this.action_feature_vectors,
            this.context_feature_vector,
            this.model_type_name
        )
        return
    }

    async trainSelectedSlide(slide_name) {
        return this.train([slide_name], [], 1)
    }

    async trainClickthrough(slide_name) {
        var first_slide_shown = this.most_recently_ranked_feature_vectors[0]
        return this.train([first_slide_shown], [], 1)
    }

    async trainFailure(slide_name) {
        var first_slide_shown = this.most_recently_ranked_feature_vectors[0]
        return this.train([first_slide_shown], [], 1)
    }

}
