yui3-validation
===============

A YUI3 widget that's modeled after the famousjquery-validation plugin

How To
------

    new Y.YUI3Validation({
        formName: "#myForm",
        errorClass: 'my-error-class', #optional
        handleSubmit: mySubmitFun, #optional
        debug: false #optional
    }).render();

Add one of these classes to your html for fields.
* required
* email
* url
* date
* dateISO
* number
* digits

Optional Params
-------
- errorClass - default: 'nv_error' (the class that gets applied to all error messages)
- handleSubmit - default: null  (a function that handles the form submit action)
- debug - default: false (adds some console logs)
