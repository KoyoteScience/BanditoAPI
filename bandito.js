from enum import Enum
import requests
import json
import time

# Note that Cognito ended up signing me in to bandito.api with this URL: https://www.banditoapi.com/?code=3ecbc40e-a82a-43da-a89b-db7a79fe66f6

class ModelType(Enum):

    def __str__(self):
        return self.value

    SGDRegressor = 'SGDRegressor'
    BayesLinearRegressor = 'BayesLinearRegressor'
    TrailingBayesLinearRegressor = 'TrailingBayesLinearRegressor'
    EmpiricalRegressor = 'EmpiricalRegressor'


class banditoAPI:

    def __str__(self):
        return f'banditoAPI instance with model_id: "{self.model_id}"'

    def __repr__(self):
        return str(self)

    def __init__(self,
                 api_key=None,
                 model_id=None,
                 action_feature_metadata=None,
                 context_feature_metadata=None,
                 output_metadata=None,
                 model_type_name='BayesLinearRegressor',
                 action_feature_vectors=None,
                 predict_on_all_models=False,
                 trailing_list_length=None,
                 coreset_trailing_list_length=None,
                 should_we_return_complete_payload=False
                 ):
        if action_feature_metadata is None:
            action_feature_metadata = []
        if context_feature_metadata is None:
            context_feature_metadata = []
        if context_feature_metadata is None:
            context_feature_metadata = {
                'linear_logistic_or_categorical': 'linear'
            }
        self.api_key = api_key
        self.url = 'https://akn4hgmvuc.execute-api.us-west-2.amazonaws.com/staging/'
        self.model_id = model_id
        self.action_feature_metadata = action_feature_metadata
        self.context_feature_metadata = context_feature_metadata
        self.output_metadata = output_metadata
        self.model_type_name = model_type_name
        self.predict_on_all_models = predict_on_all_models
        self.action_feature_vectors = action_feature_vectors
        self.most_recent_restart_response = None
        self.most_recent_pull_response = None
        self.most_recent_train_response = None
        self.most_recent_response = None
        self.trailing_list_length = trailing_list_length
        self.coreset_trailing_list_length = coreset_trailing_list_length
        self.should_we_return_complete_payload = should_we_return_complete_payload

    def restart(self):
        payload = {
            'model_id': self.model_id,
            'model_type_name': self.model_type_name,
            'bandit_mode': 'restart',
            'predict_on_all_models': self.predict_on_all_models,
            'action_feature_metadata': self.action_feature_metadata,
            'context_feature_metadata': self.context_feature_metadata,
            'output_metadata': self.output_metadata,
            'trailing_list_length': self.trailing_list_length,
            'coreset_trailing_list_length': self.coreset_trailing_list_length
        }
        r = requests.post(
            self.url,
            data=json.dumps({'payload': payload}),
            headers={
                'x-api-key': self.api_key
            }
        )
        r_json = r.json()
        self.most_recent_restart_response = r_json
        self.most_recent_response = r_json
        return r_json

    def pull(
            self,
            action_feature_vectors,
            context_feature_vector=None,
            model_type_name=None,
            predict_on_all_models=False,
            model_index=None,
            deterministic=False,
            should_we_return_complete_payload=None
    ):

        if context_feature_vector is None:
            context_feature_vector = []

        if model_type_name is None:
            model_type_name = str(self.model_type_name)
        else:
            model_type_name = str(model_type_name)

        if should_we_return_complete_payload is None:
            should_we_return_complete_payload = self.should_we_return_complete_payload

        payload = {
            'model_id': self.model_id,
            'model_type_name': model_type_name,
            'bandit_mode': 'pull',
            'predict_on_all_models': predict_on_all_models,
            'action_feature_metadata': self.action_feature_metadata,
            'context_feature_metadata': self.context_feature_metadata,
            'output_metadata': self.output_metadata,
            'action_feature_vectors': action_feature_vectors,
            'context_feature_vector': context_feature_vector,
            'model_index': model_index,
            'trailing_list_length': self.trailing_list_length,
            'coreset_trailing_list_length': self.coreset_trailing_list_length,
            'should_we_return_complete_payload': should_we_return_complete_payload
        }
        r = requests.post(
            self.url,
            data=json.dumps({'payload': payload}),
            headers={
                'x-api-key': self.api_key
            }
        )
        r_json = r.json()

        if deterministic:
            try:
                r_json['prediction'] = r_json['deterministic_prediction']
                r_json['coefficients_for_chosen_model'] = r_json['deterministic_model_coefficients']
                r_json['intercept_for_chosen_model'] = r_json['deterministic_model_intercept']
            except:
                pass

        self.most_recent_pull_response = r_json
        self.most_recent_response = r_json
        return r_json

    def train(
            self,
            action_feature_vector,
            output_value,
            context_feature_vector=None,
            weights=None,
            should_we_return_complete_payload=None
    ):

        if context_feature_vector is None:
            context_feature_vector = []

        if should_we_return_complete_payload is None:
            should_we_return_complete_payload = self.should_we_return_complete_payload

        payload = {
            'model_id': self.model_id,
            'model_type_name': 'SGDRegressor',  # TODO: This currently just overwrites, and should be settable
            'bandit_mode': 'train',
            'action_feature_metadata': self.action_feature_metadata,
            'context_feature_metadata': self.context_feature_metadata,
            'output_metadata': self.output_metadata,
            'action_feature_vectors': [action_feature_vector],
            'output_value': output_value,
            'context_feature_vector': context_feature_vector,
            'timestamp_of_payload_creation': time.time() * 1000,
            # to line up with javascript which returns milliseconds
            'trailing_list_length': self.trailing_list_length,
            'coreset_trailing_list_length': self.coreset_trailing_list_length,
            'should_we_return_complete_payload': should_we_return_complete_payload
        }
        r = requests.post(
            self.url,
            data=json.dumps({'payload': payload}),
            headers={
                'x-api-key': self.api_key
            }
        )
        r_json = r.json()
        self.most_recent_train_response = r_json
        self.most_recent_response = r_json
        return r_json

    def select(
            self,
            model_type_name=None,
            action_feature_vectors=None,
            context_feature_vector=None,
            predict_on_all_models=False,
            model_index=None,
            deterministic=False
    ):
        if action_feature_vectors is None:
            action_feature_vectors = self.action_feature_vectors
        if context_feature_vector is None:
            context_feature_vector = []
        self.pull(
            action_feature_vectors,
            context_feature_vector=context_feature_vector,
            model_type_name=model_type_name,
            model_index=model_index,
            deterministic=deterministic,
            predict_on_all_models=predict_on_all_models
        )
        return self.most_recent_pull_response['chosen_action_index']


class headlineOptimizer(banditoAPI):

    def __init__(
            self,
            api_key,
            model_id,
            list_of_possible_headlines,
            model_type_name='EmpiricalRegressor'
    ):
        action_feature_metadata = [{
            'name': 'text_to_choose',
            'categorical_or_continuous': 'categorical',
            'possible_values': list_of_possible_headlines
        }]
        action_feature_vectors = []

        for headline in list_of_possible_headlines:
            action_feature_vectors.append([headline])

        bandit_metadata = {
            'model_id': model_id,
            'model_type_name': model_type_name,
            'action_feature_metadata': action_feature_metadata,
            'context_feature_metadata': [],
            'predict_on_all_models': False
        }

        super().__init__(
            api_key=api_key,
            model_id=bandit_metadata.model_id,
            action_feature_metadata=bandit_metadata.action_feature_metadata,
            context_feature_metadata=bandit_metadata.context_feature_metadata,
            model_type_name=bandit_metadata.model_type_name,
            action_feature_vectors=bandit_metadata.action_feature_vectors,
            predict_on_all_models=bandit_metadata.predict_on_all_models
        )

        self.most_recently_selected_headline = None

    def selectHeadline(self):
        action_index = self.select_with_automatic_restart(
            self.feature_vectors,
            self.model_type_name
        )
        self.most_recently_selected_headline = self.feature_vectors[action_index][0]
        return self.feature_vectors[action_index][0]

    def trainMostRecentlySelectedHeadline(self, reward):
        return self.train([self.most_recently_selected_headline], [reward])
