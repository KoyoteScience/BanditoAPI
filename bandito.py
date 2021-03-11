from enum import Enum
import requests
import json
import time


# Note that Cognito ended up signing me in to bandito.api with this URL: https://www.banditoapi.com/?code=3ecbc40e-a82a-43da-a89b-db7a79fe66f6

class ModelType(Enum):

    def __str__(self):
        return self.value

    SGDRegressor = 'SGDRegressor'
    LinearAlgebraLinearRegression = 'LinearAlgebraLinearRegression'
    AverageCategoryMembership = 'AverageCategoryMembership'
    CovarianceLinearRegression = 'CovarianceLinearRegression'  # note that this model has no bootstrap implemented


class banditoAPI:

    def __str__(self):
        return f'banditoAPI instance with model_id: "{self.model_id}"'

    def __repr__(self):
        return str(self)

    def __init__(self,
                 api_key=None,
                 model_id=None,
                 feature_metadata=None,
                 model_type='CovarianceLinearRegression',
                 feature_vectors=None,
                 predict_on_all_models=False
                 ):
        self.api_key = api_key
        self.url = 'https://akn4hgmvuc.execute-api.us-west-2.amazonaws.com/prod/'
        self.model_id = model_id
        self.feature_metadata = feature_metadata
        self.model_type = ModelType[model_type]
        self.predict_on_all_models = predict_on_all_models
        self.feature_vectors = feature_vectors
        self.most_recent_restart_response = None
        self.most_recent_pull_response = None
        self.most_recent_train_response = None
        self.most_recent_response = None

    def restart(self):
        payload = {
            'model_id': self.model_id,
            'model_type': {'name': str(self.model_type)},
            'bandit_mode': 'restart',
            'predict_on_all_models': self.predict_on_all_models,
            'feature_metadata': self.feature_metadata
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
            feature_vectors, 
            model_type=None, 
            predict_on_all_models=False, 
            model_index=None,
            deterministic=False
    ):

        if model_type is None:
            model_type_dict = {'name': str(self.model_type)}
        else:
            model_type_dict = {'name': str(model_type)}

        payload = {
            'model_id': self.model_id,
            'model_type': model_type_dict,
            'bandit_mode': 'pull',
            'predict_on_all_models': predict_on_all_models,
            'feature_metadata': self.feature_metadata,
            'feature_vectors': feature_vectors,
            'model_index': model_index
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
                r_json['prediction_for_chosen_model'] = r_json['deterministic_prediction']
                r_json['coefficients_for_chosen_model'] = r_json['deterministic_model_coefficients']
                r_json['intercept_for_chosen_model'] = r_json['deterministic_model_intercept']
            except:
                pass

        self.most_recent_pull_response = r_json
        self.most_recent_response = r_json
        return r_json

    def train(
            self, 
            feature_vectors, 
            output_values
    ):
        payload = {
            'model_id': self.model_id,
            'model_type': {'name': 'SGDRegressor'},  # TODO: This currently just overwrites, and should be settable
            'bandit_mode': 'train',
            'feature_metadata': self.feature_metadata,
            'feature_vectors': feature_vectors,
            'output_values': output_values,
            'timestamp_of_payload_creation': time.time() * 1000  # to line up with javascript which returns milliseconds
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
            model_type=None, 
            feature_vectors=None, 
            predict_on_all_models=False, 
            model_index=None, 
            deterministic=False
    ):
        if feature_vectors is None:
            feature_vectors = self.feature_vectors
        self.pull(
            feature_vectors, 
            model_type=model_type, 
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
            model_type='AverageCategoryMembership'
    ):
        feature_metadata = [{
            'name': 'text_to_choose',
            'categorical_or_continuous': 'categorical',
            'possible_values': list_of_possible_headlines
        }]
        feature_vectors = []
        
        for headline in list_of_possible_headlines:
            feature_vectors.append([headline])
            
        bandit_metadata = {
            'model_id': model_id,
            'model_type': model_type,
            'feature_vectors': feature_vectors,
            'feature_metadata': feature_metadata,
            'predict_on_all_models': False
        }
        
        super().__init__(
            api_key=api_key,
            model_id=bandit_metadata.model_id,
            feature_metadata=bandit_metadata.feature_metadata,
            model_type=bandit_metadata.model_type,
            feature_vectors=bandit_metadata.feature_vectors,
            predict_on_all_models=bandit_metadata.predict_on_all_models
        )
        
        self.most_recently_selected_headline = None

    def selectHeadline(self):
        action_index = self.select_with_automatic_restart(
            self.feature_vectors,
            self.model_type
        )
        self.most_recently_selected_headline = self.feature_vectors[action_index][0]
        return self.feature_vectors[action_index][0]

    def trainMostRecentlySelectedHeadline(self, reward):
        return self.train([self.most_recently_selected_headline], [reward])
