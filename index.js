var _ = require('lodash');
var request = require('request').defaults({
    baseUrl: 'https://app.asana.com/api/1.0/'
});
var globalPickResult = {
    'data': {
        fields: {
            id: 'id',
            name: 'name'
        }
    }
};

module.exports = {
    /**
     * Return pick result.
     *
     * @param output
     * @param pickResult
     * @returns {*}
     */
    pickResult: function (output, pickTemplate) {
        var result = {};
        // map template keys
        _.map(_.keys(pickTemplate), function (templateKey) {

            var oneTemplateObject = pickTemplate[templateKey];
            var outputKeyValue = _.get(output, templateKey, undefined);

            if (_.isUndefined(outputKeyValue)) {

                return result;
            }
            // if template key is object - transform, else just save
            if (_.isObject(oneTemplateObject)) {
                // if data is array - map and transform, else once transform
                if (_.isArray(outputKeyValue)) {

                    result = this._mapPickArrays(outputKeyValue, oneTemplateObject);
                } else {

                    result[oneTemplateObject.key] = this.pickResult(outputKeyValue, oneTemplateObject.fields);
                }
            } else {

                _.set(result, oneTemplateObject, outputKeyValue);
            }
        }, this);

        return result;
    },

    /**
     * System func for pickResult.
     *
     * @param mapValue
     * @param templateObject
     * @returns {*}
     * @private
     */
    _mapPickArrays: function (mapValue, templateObject) {

        var arrayResult = [],
            result = templateObject.key? {} : [];

        _.map(mapValue, function (inOutArrayValue) {

            arrayResult.push(this.pickResult(inOutArrayValue, templateObject.fields));
        }, this);

        if (templateObject.key) {

            result[templateObject.key] = arrayResult;
        } else {

            result = arrayResult;
        }

        return result;
    },

    /**
     * Return auth object.
     *
     *
     * @param dexter
     * @returns {*}
     */
    authParams: function (dexter) {
        var res = {};

        if (dexter.environment('asana_access_token')) {
            res = {
                bearer: dexter.environment('asana_access_token')
            };
        } else {
            this.fail('A [asana_access_token] env variables need for this module');
        }

        return res;
    },

    /**
     * Send api request.
     *
     * @param method
     * @param api
     * @param options
     * @param auth
     * @param callback
     */
    apiRequest: function (method, api, options, auth, callback) {

        request[method]({url: api, form: options, auth: auth, json: true}, callback);
    },

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var auth = this.authParams(dexter);

        this.apiRequest('get', 'tags/' + step.input('tag').first() + '/tasks', {}, auth, function (error, responce, body) {

            if (error || body.errors) {

                this.fail(error || body.errors);
            } else {

                this.complete(this.pickResult(body, globalPickResult));
            }
        }.bind(this));
    }
};
