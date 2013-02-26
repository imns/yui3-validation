/*
TODO:
- only show one error message at a time
- finish validation methods
- add custom rules
*/

YUI().add('yui3-validation', function(Y) {
    function YUI3Validation(config) {
        YUI3Validation.superclass.constructor.apply(this, arguments);
    }

    YUI3Validation.NAME = "yui3Validation";

    YUI3Validation.ATTRS = {

        formName: {
            value: null
        },

        errorClass: {
            value: 'nv_error'
        },

        handleSubmit: {
            value: null
        },

        context: {
            value: null
        },

        debug: {
            value: false
        }
    };

    Y.extend(YUI3Validation, Y.Widget, {

        initializer: function() {

            this.currentForm = Y.one(this.get('formName'));
            this.errorClass = this.get('errorClass');
            this.handleSubmit = this.get('handleSubmit');
            this.debug = this.get('debug');
            this.hasSubmitted = false;

            this.messages = {
                required: "This field is required.",
                remote: "Please fix this field.",
                email: "Please enter a valid email address.",
                url: "Please enter a valid URL.",
                date: "Please enter a valid date.",
                dateISO: "Please enter a valid date (ISO).",
                number: "Please enter a valid number.",
                digits: "Please enter only digits.",
                creditcard: "Please enter a valid credit card number.",
                equalTo: "Please enter the same value again."
                // maxlength: $.validator.format("Please enter no more than {0} characters."),
                // minlength: $.validator.format("Please enter at least {0} characters."),
                // rangelength: $.validator.format("Please enter a value between {0} and {1} characters long."),
                // range: $.validator.format("Please enter a value between {0} and {1}."),
                // max: $.validator.format("Please enter a value less than or equal to {0}."),
                // min: $.validator.format("Please enter a value greater than or equal to {0}.")
            };

            this.classRuleSettings = {
                required: {
                    required: true
                },
                email: {
                    email: true
                },
                url: {
                    url: true
                },
                date: {
                    date: true
                },
                dateISO: {
                    dateISO: true
                },
                number: {
                    number: true
                },
                digits: {
                    digits: true
                },
                creditcard: {
                    creditcard: true
                }
            };

            this.errors = [];


            //publish events
            // this.publish("onLoad", {
            //     broadcast: 1
            // });
        },

        destructor: function() {},

        renderUI: function() {},

        bindUI: function() {
            this.currentForm.on('submit', function(e) {
                if(this.debug) {
                    e.preventDefault();
                    Y.log('NOT GOING TO SUBMIT BECAUSE DEBUG IS ON!!!');
                }
                this.hasSubmitted = true;
                this.validate.call(this);
                if(this.errors.length > 0) {
                    e.preventDefault();
                } else {
                    if( Y.Lang.isValue(this.handleSubmit) ) {
                        if( this.get('context') ) {
                            this.handleSubmit.call(this.get('context'), e);
                        } else {
                            this.handleSubmit(e);
                        }
                        e.preventDefault();
                    } else {
                        return true;
                    }
                }
            }, this);

            Y.each(this.elements(), function(node) {
                if( this.checkable(node) ) {
                    node.on('click', this.validate, this);
                } else if( node._node.nodeName.toLowerCase() === 'select' ) {
                    node.on('change', this.validate, this);
                } else {
                    node.on('keyup', this.validate, this);
                }
            }, this);
        },

        syncUI: function() {},


        validate: function(e) {
            this._resetErrors();

            if( this.hasSubmitted ) {
                Y.each(this.elements(), function(node) {
                    this._check(node);
                }, this);
            }

            this._showErrors();
        },

        _check: function(element) {
            var classes = this.classRules(element),
                rules = this.classRuleSettings,
                val = this.elementValue(element);

            Y.each(classes, function(meth) {
                try {
                    var rule = {
                        method: meth,
                        parameters: rules[meth]
                    };
                    var validatorMethod = this[meth];

                    result = validatorMethod.call(this, val, element, rule.parameters);
                    if ( this.debug ) {
                        this.debugLog(element, result);
                    }

                    if( !result ) {
                        this._addError(element, this.messages[meth]);
                    }
                } catch(e) {
                    if ( this.debug ) {
                        Y.log("exception occured when checking element " + element.get('id') + ", check the '" + rule.method + "' method", e);
                    }
                    throw e;
                }
            }, this);
        },



        /*
         * ===================================================================================
         *  Format Methods
         * ===================================================================================
         */

        _resetErrors: function() {
            this.errors = [];
            Y.all('.'+this.errorClass).remove();
        },

        _addError: function(element, message) {
            this.errors.push({
                element: element,
                message: message
            });
        },

        _showErrors: function() {
            var formattedMessage, nodes;

            //focus on the first non valid element
            if( Y.Lang.isValue(this.errors[0]) ) {
                this.errors[0].element.focus();
            }

            Y.each(this.errors, function(error) {

                if( this.checkable(error.element) ) {
                    //get the last element in a group
                    formattedMessage = ' <label class="'+this.errorClass+'">' + error.message + '</label>';
                    nodes = this.findByName( error.element._node.name );
                    nodes.item(nodes.size() - 1).insert(formattedMessage, 'after');
                } else {
                    formattedMessage = '<label class="'+this.errorClass+'"><br>' + error.message + '</label>';
                    error.element.insert(formattedMessage, 'after');
                    //this._highlight(error.element);
                }

            }, this);
        },

        // _highlight: function(element) {
        //     element.setStyle('border', '1px solid #FF0000');
        // },



        /*
         * ===================================================================================
         *  Helper Methods
         * ===================================================================================
         */

        elements: function() {
            // select all valid inputs inside the form (no submit or reset buttons)
            var elementsArray = [],
                rulesCache = {},
                elementsNodeList = Y.one(this.currentForm)
                    .all("input, select, textarea ")
                    .filter(":not([type=submit])")
                    .filter(":not([type=reset])")
                    .filter(":not([type=image])")
                    .filter(":not([disabled])");

            elementsNodeList.each(function(el) {
                elementsArray.push(el);
            });

            var newElementsList = Y.Array.filter(elementsArray, function(el) {
                if( !this.checkable(el) ) return true;
                if( el._node.name in rulesCache ) {
                    return false;
                }
                rulesCache[el._node.name] = true;
                return true;
            }, this);

            return newElementsList;
            //.not( this.settings.ignore )
        },

        elementValue: function(element) {
            var type = element.getAttribute('type').toLowerCase(),
                name = element.getAttribute('name').toLowerCase(),
                val = element.get('value'), el;

            if(type === 'radio' || type === 'checkbox') {

                try {
                    el = Y.one('input[name=' + name + ']').get('value');
                } catch(e) {
                    //clean names
                    Y.all("input").each(function(node) {
                        var name = node.getAttribute('name');
                        var cleanName = name.replace(/\W/g, '_');

                        node.setAttribute('name', cleanName);
                    }, this);

                    el = Y.one('input[name=' + name.replace(/\W/g, '_') + ']').get('value');
                }

                return el;
            }

            if(typeof val === 'string') {
                return val.replace(/\r/g, "");
            }
            return val;
        },

        findByName: function( name ) {
            return this.currentForm.all('[name="' + name + '"]');
        },

        checkable: function(element) {
            return(/radio|checkbox/i).test(element._node.type);
        },

        validationTargetFor: function(element) {
            // if radio/checkbox, validate first element in group instead
            if (this.checkable(element)) {
                element = this.findByName( element._node.name ).item(0);
            }
            return element;
        },

        getLength: function(value, element) {
            //START HERE NATE
            switch(element._node.nodeName.toLowerCase()) {
            case 'select':
                return element.one('option[selected]').length;
            case 'input':
                if(this.checkable(element)) {
                    return this.findByName( element._node.name ).filter(':checked').size();
                }
            }
            return value.length;
        },

        classRules: function(element) {
            var rules = [];
            var classes = element.getAttribute('class');
            if(classes) {
                Y.each(classes.split(' '), function(cl) {
                    if(Y.Object.hasKey(this.classRuleSettings, cl)) {
                        rules.push(cl);
                    }
                }, this);
            }
            return rules;
        },

        debugLog: function(element, result) {
            Y.log('--------------------');
            Y.log('Element:');
            Y.log(element);
            Y.log('Classes: '+element.getAttribute('class'));
            Y.log('Validation result: ' + result);
            Y.log('     ');
        },


        /*
         * ===================================================================================
         *  Validator Methods
         * ===================================================================================
         */

        required: function(value, element, param) {
            if(element._node.nodeName.toLowerCase() === "select") {
                // could be an array for select-multiple or a string, both are fine this way
                var val = element.get('value');
                return val && val.length > 0;
            }
            if(this.checkable(element)) {
                return this.getLength(value, element) > 0;
            }
            return Y.Lang.trim(value).length > 0;
        },

        // http://docs.jquery.com/Plugins/Validation/Methods/minlength
        // minlength: function(value, element, param) {
        //     var length = Y.Lang.isArray( value ) ? value.length : this.getLength($.trim(value), element);
        //     return this.optional(element) || length >= param;
        // },
        // // http://docs.jquery.com/Plugins/Validation/Methods/maxlength
        // maxlength: function(value, element, param) {
        //     var length = $.isArray( value ) ? value.length : this.getLength($.trim(value), element);
        //     return this.optional(element) || length <= param;
        // },
        // // http://docs.jquery.com/Plugins/Validation/Methods/rangelength
        // rangelength: function(value, element, param) {
        //     var length = $.isArray( value ) ? value.length : this.getLength($.trim(value), element);
        //     return this.optional(element) || ( length >= param[0] && length <= param[1] );
        // },
        // // http://docs.jquery.com/Plugins/Validation/Methods/min
        // min: function( value, element, param ) {
        //     return this.optional(element) || value >= param;
        // },
        // // http://docs.jquery.com/Plugins/Validation/Methods/max
        // max: function( value, element, param ) {
        //     return this.optional(element) || value <= param;
        // },
        // // http://docs.jquery.com/Plugins/Validation/Methods/range
        // range: function( value, element, param ) {
        //     return this.optional(element) || ( value >= param[0] && value <= param[1] );
        // },
        // http://docs.jquery.com/Plugins/Validation/Methods/email
        email: function(value, element) {
            // contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
            return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
        },
        // http://docs.jquery.com/Plugins/Validation/Methods/url
        url: function(value, element) {
            // contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
            return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
        },
        // http://docs.jquery.com/Plugins/Validation/Methods/date
        date: function(value, element) {
            return !/Invalid|NaN/.test(new Date(value));
        },
        // http://docs.jquery.com/Plugins/Validation/Methods/dateISO
        dateISO: function(value, element) {
            return /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(value);
        },
        // http://docs.jquery.com/Plugins/Validation/Methods/number
        number: function(value, element) {
            return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
        },
        // http://docs.jquery.com/Plugins/Validation/Methods/digits
        digits: function(value, element) {
            return /^\d+$/.test(value);
        }
        // // http://docs.jquery.com/Plugins/Validation/Methods/creditcard
        // // based on http://en.wikipedia.org/wiki/Luhn
        // creditcard: function(value, element) {
        //     if ( this.optional(element) ) {
        //         return "dependency-mismatch";
        //     }
        //     // accept only spaces, digits and dashes
        //     if (/[^0-9 \-]+/.test(value)) {
        //         return false;
        //     }
        //     var nCheck = 0,
        //         nDigit = 0,
        //         bEven = false;
        //     value = value.replace(/\D/g, "");
        //     for (var n = value.length - 1; n >= 0; n--) {
        //         var cDigit = value.charAt(n);
        //         nDigit = parseInt(cDigit, 10);
        //         if (bEven) {
        //             if ((nDigit *= 2) > 9) {
        //                 nDigit -= 9;
        //             }
        //         }
        //         nCheck += nDigit;
        //         bEven = !bEven;
        //     }
        //     return (nCheck % 10) === 0;
        // }


    });

    Y.YUI3Validation = YUI3Validation;

}, '1.0', {
    require: ["widget"]
});