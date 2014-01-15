
  basis.require('basis.net');

  var namespace = this.path;


  // features support detection

  function fileAPISupport(){
    var input = document.createElement('input');
    input.type = 'file';
    return input.files !== undefined;
  }

  function formDataSupport(){
    return window.FormData !== undefined;
  }

  function createIFrame(){
    var frame = document.createElement('iframe');
    frame.style.position = 'absolute';
    frame.style.left = '-2000px';
    frame.style.top = '-2000px';
    frame.name = frame.id = 'f' + Math.floor(Math.random() * 99999);
    frame.src = 'about:blank';

    return frame;
  }

  function getIFrameDocument(frame){
    return frame.contentWindow ? frame.contentWindow.document : frame.contentDocument ? frame.contentDocument : frame.document;
  }

  //
  // FileUploader
  //
  var FileUploader;

  if (fileAPISupport() && formDataSupport()) // XMLHttpRequest2
  {
    FileUploader = basis.net.Transport.subclass({
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
          postBody: formData
        }));
      },

      uploadFiles: function(url, files, fileParam){
        var formData = new FormData();

        for (var i = 0, file; file = files[i]; i++)
          formData.append(fileParam || file.name, file);

        this.request({
          url: url,
          postBody: formData
        });
      },

      emit_start: function(request){
        basis.dom.event.addHandler(request.xhr.upload, 'progress', REQUEST_PROGRESS_HANDLER, request);
        basis.net.Transport.prototype.emit_start.call(this, request);
      },
      emit_complete: function(request){
        basis.dom.event.removeHandler(request.xhr.upload, 'progress', REQUEST_PROGRESS_HANDLER, request);
        basis.net.Transport.prototype.emit_complete.call(this, request);
      }
    });

    var REQUEST_PROGRESS_HANDLER = function(event){
      if (event.lengthComputable)
        this.setState(basis.data.STATE.PROCESSING, { loaded: event.loaded, total: event.total });
    };
  }
  else //IFrame
  {
    var IFrameRequest = basis.net.AbstractRequest.subclass({
      className: namespace + '.IFrameRequest',

      state: basis.data.STATE.UNDEFINED,
      inprogress: false,

      init: function(){
        basis.net.AbstractRequest.prototype.init.call(this);

        this.frame = createIFrame();

        basis.dom.event.addHandlers(this.frame, { load: this.onLoad }, this);
      },
      onLoad: function(event){
        if (this.inprogress)
        {
          this.processResponse();

          if (this.isSuccessful())
            this.transport.emit_success(this);
          else
            this.transport.emit_failure(this);

          this.transport.emit_complete(this);

          this.inprogress = false;
          var that = this;
          setTimeout(function(){
            that.removeFrame();
          }, 100);

          this.setState(basis.data.STATE.READY);
        }
      },
      isSuccessful: function(){
        return true;
      },
      processResponse: function(){
        var doc = getIFrameDocument(this.frame);
        var docRoot = doc.body ? doc.body : doc.documentElement;
        this.update({
          responseText: docRoot ? docRoot.innerHTML : null,
          responseXML: doc.XMLDocument ? doc.XMLDocument : doc
        });
      },
      insertFrame: function(){
        document.body.appendChild(this.frame);
      },
      removeFrame: function(){
        document.body.removeChild(this.frame);
      },
      doRequest: function(){
        var form = this.requestData.form;
        if (!form)
          return;

        this.transport.emit_start(this);
        this.insertFrame();
        this.inprogress = true;
        this.setState(basis.data.STATE.PROCESSING);

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

        basis.net.AbstractRequest.prototype.destroy.call();
      }
    });

    FileUploader = basis.net.AbstractTransport.subclass({
      className: namespace + '.FileUploader',

      requestClass: IFrameRequest,

      formSubmit: function(form, requestData){
        var requestConfig = basis.object.extend({}, requestData);
        this.request(basis.object.extend(requestConfig, { form: form }));
      }
    });
  }

  // exports
  module.exports = {
    FileUploader: FileUploader
  }
