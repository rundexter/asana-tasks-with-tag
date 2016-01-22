var _ = require('lodash'),
    util = require('./util.js'),
    request = require('request').defaults({
        baseUrl: 'https://app.asana.com/api/1.0/'
    }),
    pickInputs = {
        'tag': { key: 'tag', validate: { req: true } }
    },
    pickOutputs = {
        'id': { key: 'data', fields: ['id'] },
        'name': { key: 'data', fields: ['name'] }
    };

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var credentials = dexter.provider('asana').credentials('access_token'),
            inputs = util.pickInputs(step, pickInputs),
            validateErrors = util.checkValidateErrors(inputs, pickInputs);

        // check params.
        if (validateErrors)
            return this.fail(validateErrors);

        //send API request
        request.get({
            uri: 'tags/' + inputs.tag  + '/tasks',
            json: true,
            auth: {
                'bearer': credentials
            }
        }, function (error, response, body) {
            if (error || (body && body.errors) || response.statusCode >= 400)
                this.fail(error || body.errors || { statusCode: response.statusCode, headers: response.headers, body: body });
            else
                this.complete(util.pickOutputs(body, pickOutputs) || {});

        }.bind(this));
    }
};
