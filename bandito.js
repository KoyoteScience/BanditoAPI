export default class banditoAPI {

    toString() {
        return 'banditoAPI instance with model_id: ' + this.model_id
    }

    constructor(
        api_key = null,
        model_id = null,
        feature_metadata = null,
        model_type = 'CovarianceLinearRegression',
        predict_on_all_models = false,
        feature_vectors = null,
    ) {
        this.api_key = api_key
        this.url = 'https://akn4hgmvuc.execute-api.us-west-2.amazonaws.com/staging/'
        this.model_id = model_id
        this.feature_metadata = feature_metadata
        this.model_type = model_type
        this.predict_on_all_models = predict_on_all_models
        this.feature_vectors = feature_vectors
        this.most_recent_restart_response = null
        this.most_recent_pull_response = null
        this.most_recent_train_response = null
        this.most_recent_response = null
        this.progress = null
    }

    async restart() {

        var payload = {
            'model_id': this.model_id,
            'model_type': {'name': this.model_type},
            'bandit_mode': 'restart',
            'predict_on_all_models': this.predict_on_all_models,
            'feature_metadata': this.feature_metadata
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
                return {'errorMessage': 'Failure during fetch in javascript', err: err}
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

    async pull(feature_vectors, model_type = null, predict_on_all_models = false, model_index = null, deterministic = false, attempt_restart = false) {

        if (model_type == null) {
            var model_type_dict = {'name': this.model_type}
        } else {
            var model_type_dict = {'name': model_type}
        }

        var payload = {
            'model_id': this.model_id,
            'model_type': model_type_dict,
            'bandit_mode': 'pull',
            'predict_on_all_models': predict_on_all_models,
            'feature_metadata': this.feature_metadata,
            'feature_vectors': feature_vectors,
            'model_index': model_index
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
                return {'errorMessage': 'Failure during fetch in javascript'}
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
                        return {'errorMessage': 'Failure during fetch in javascript'}
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
            response.body['prediction_for_chosen_model'] = response.body['deterministic_prediction']
            response.body['coefficients_for_chosen_model'] = response.body['deterministic_model_coefficients']
            response.body['intercept_for_chosen_model'] = response.body['deterministic_model_intercept']
        }

        this.most_recent_pull_response = response.body
        this.most_recent_response = response.body
        this.progress = response.body.progress
        response.body.success = true
        return response.body
    }

    async train(feature_vectors, output_values) {
        var payload = {
            'model_id': this.model_id,
            'model_type': {'name': 'SGDRegressor'},  // TODO: This currently just overwrites, and should be settable
            'bandit_mode': 'train',
            'feature_metadata': this.feature_metadata,
            'feature_vectors': feature_vectors,
            'output_values': output_values,
            'timestamp_of_payload_creation': (new Date().getTime())
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
                return {'errorMessage': 'Failure during fetch in javascript'}
            }
        );

        if (Object.keys(response).includes('body')) {
            response.body = JSON.parse(response.body)
        } else if (Object.keys(response).includes('alias')) {
            response.body = {...response}
        } else {
            response.body.success = true
            response.body
        }

        this.most_recent_train_response = response.body
        this.most_recent_response = response.body
        this.progress = response.body.progress
        response.body.success = true
        return response.body
    }

    async select(feature_vectors = null, model_type = null, predict_on_all_models = false, model_index = null, deterministic = false, attempt_restart = false) {
        if (feature_vectors == null || feature_vectors == undefined) {
            feature_vectors = this.feature_vectors
        }
        await this.pull(feature_vectors, model_type, predict_on_all_models, model_index, deterministic, attempt_restart)
        return this.most_recent_pull_response['chosen_action_index']
    }

    async select_with_automatic_restart(feature_vectors = null, model_type = null, predict_on_all_models = false, model_index = null, deterministic = false) {
        if (feature_vectors == null || feature_vectors == undefined) {
            feature_vectors = this.feature_vectors
        }
        var attempt_restart = true
        await this.pull(feature_vectors, model_type, predict_on_all_models, model_index, deterministic, attempt_restart)
        return this.most_recent_pull_response['chosen_action_index']
    }
}


export class headlineOptimizer extends banditoAPI {

    constructor(api_key, model_id, list_of_possible_headlines) {

        var feature_metadata = [{
            'name': 'text_to_choose',
            'categorical_or_continuous': 'categorical',
            'possible_values': list_of_possible_headlines
        }]

        var feature_vectors = []
        for (var headline of list_of_possible_headlines) {
            feature_vectors.push([headline])
        }

        var bandit_metadata = {
            'model_id': model_id,
            'model_type': 'AverageCategoryMembership', // options include CovarianceLinearRegression, LinearAlgebraLinearRegression, AverageCategoryMembership
            'feature_vectors': feature_vectors,
            'feature_metadata': feature_metadata,
            'predict_on_all_models': false
        }

        super(
            api_key,
            bandit_metadata.model_id,
            bandit_metadata.feature_metadata,
            bandit_metadata.model_type,
            bandit_metadata.predict_on_all_models,
            bandit_metadata.feature_vectors
        )
        this.most_recently_selected_headline = null

    }

    async selectHeadline() {
        var action_index = await this.select_with_automatic_restart(
            this.feature_vectors,
            this.model_type
        )
        this.most_recently_selected_headline = this.feature_vectors[action_index][0]
        return this.feature_vectors[action_index][0]
    }

    async trainMostRecentlySelectedHeadline(reward) {
        return this.train([this.most_recently_selected_headline], [reward])
    }
}
