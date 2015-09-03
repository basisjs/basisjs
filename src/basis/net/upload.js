
 /**
  * @namespace basis.net.upload
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var FormData = global.FormData;
  var eventUtils = require('basis.dom.event'); // TODO
  var STATE = require('basis.data').STATE;
  var basisNet = require('basis.net');
  var AbstractTransport = basisNet.AbstractTransport;
  var AbstractRequest = basisNet.AbstractRequest;
  var AjaxTransport = require('basis.net.ajax').Transport;


  //
  // main part
  //

  var JSON_CONTENT_TYPE = /^application\/json/i;

  function safeJsonParse(content){
    try {
      return basis.json.parse(content);
    } catch(e) {
      /** @cut */ var url = arguments[1];
      /** @cut */ basis.dev.warn('basis.net.ajax: Can\'t parse JSON from ' + url, { url: url, content: content });
    }
  }


  // features support detection

  function fileAPISupport(){
    var input = document.createElement('input');
    input.type = 'file';
    return input.files !== undefined;
  }

  function formDataSupport(){
    return FormData !== undefined;
  }


 /**
  * @class
  */
  var FileUploader;

  if (fileAPISupport() && formDataSupport()) // XMLHttpRequest2
  {
    var REQUEST_PROGRESS_HANDLER = function(event){
      if (event.lengthComputable)
        this.setState(STATE.PROCESSING, {
          loaded: event.loaded,
          total: event.total
        });
    };

    FileUploader = AjaxTransport.subclass({
      className: namespace + '.FileUploader',

      method: 'POST',
      contentType: 'multipart/form-data',

      formSubmit: function(form, requestData){
        var formData = new FormData();

        for (var i = 0, field; field = form.elements[i]; i++)
        {
          if (field.files)
          {
            for (var j = 0; j < field.files.length; j++)
              formData.append(field.name, field.files[j]);
          }
          else
            formData.append(field.name, field.value);
        }

        var requestConfig = basis.object.extend({}, requestData);

        this.request(basis.object.extend(requestConfig, {
          url: form.action,
          body: formData
        }));
      },

      uploadFiles: function(url, files, fileParam){
        var formData = new FormData();

        // if form passed
        if (url.action)
          url = url.action;

        for (var i = 0, file; file = files[i]; i++)
          formData.append(fileParam || file.name, file);

        this.request({
          url: url,
          body: formData
        });
      },

      emit_start: function(request){
        eventUtils.addHandler(request.xhr.upload, 'progress', REQUEST_PROGRESS_HANDLER, request);
        AjaxTransport.prototype.emit_start.call(this, request);
      },
      emit_complete: function(request){
        eventUtils.removeHandler(request.xhr.upload, 'progress', REQUEST_PROGRESS_HANDLER, request);
        AjaxTransport.prototype.emit_complete.call(this, request);
      }
    });
  }
  else //IFrame
  {
    var createIFrame = function(){
      var frame = document.createElement('iframe');
      frame.style.position = 'absolute';
      frame.style.left = '-2000px';
      frame.style.top = '-2000px';
      frame.name = frame.id = 'uploadFrame' + basis.genUID();
      frame.src = 'about:blank';

      return frame;
    };

    var getIFrameDocument = function(frame){
      return frame.contentWindow
        ? frame.contentWindow.document
        : frame.contentDocument
          ? frame.contentDocument
          : frame.document;
    };


   /**
    * @class
    */
    var IFrameRequest = AbstractRequest.subclass({
      className: namespace + '.IFrameRequest',

      state: STATE.UNDEFINED,
      inprogress: false,

      init: function(){
        AbstractRequest.prototype.init.call(this);

        this.frame = createIFrame();

        eventUtils.addHandlers(this.frame, { load: this.onLoad }, this);
      },
      onLoad: function(){
        if (this.inprogress)
        {
          this.inprogress = false;
          setTimeout(this.removeFrame.bind(this), 100);

          var newState;
          var newStateData;

          if (this.isSuccessful())
          {
            newState = STATE.READY;
            this.emit_success(this.getResponseData());
          }
          else
          {
            newState = STATE.ERROR;
            newStateData = 'error';
            this.emit_failure('error');
          }

          this.transport.emit_complete(this);

          this.setState(newState, newStateData);
        }
      },
      isSuccessful: function(){
        return true;
      },
      getResponseData: function(){
        var doc = getIFrameDocument(this.frame);
        var docRoot = doc.body || doc.documentElement;

        if (docRoot)
        {
          var response = docRoot.textContent || docRoot.innerHTML;
          var contentType = doc.contentType;

          if (JSON_CONTENT_TYPE.test(contentType))
            response = safeJsonParse(response, this.requestData.form.action);

          return response;
        }
        else
          return doc.XMLDocument || doc;
      },
      insertFrame: function(){
        basis.doc.body.add(this.frame);
      },
      removeFrame: function(){
        basis.doc.remove(this.frame);
      },
      doRequest: function(){
        var form = this.requestData.form;

        if (!form)
          return;

        this.transport.emit_start(this);
        this.insertFrame();
        this.inprogress = true;
        this.setState(STATE.PROCESSING);

        form.setAttribute('enctype', 'multipart/form-data');
        form.setAttribute('method', 'POST');
        form.setAttribute('target', this.frame.id);
        form.submit();
      },
      abort: function(){
        if (this.inprogress)
        {
          this.removeFrame();
          this.inprogress = false;
          this.transport.emit_abort(this);
        }
      },
      destroy: function(){
        this.removeFrame();
        delete this.frame;

        AbstractRequest.prototype.destroy.call(this);
      }
    });

    FileUploader = AbstractTransport.subclass({
      className: namespace + '.FileUploader',

      requestClass: IFrameRequest,

      formSubmit: function(form, requestData){
        var requestConfig = basis.object.merge(requestData, { form: form });
        this.request(requestConfig);
      }
    });
  }

  // exports
  module.exports = {
    FileUploader: FileUploader
  };
