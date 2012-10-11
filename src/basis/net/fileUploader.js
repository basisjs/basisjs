
  basis.require('basis.net.proxy');
  basis.require('basis.net.ajax');


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
    FileUploader = basis.net.ajax.AjaxProxy.subclass({
      method: 'POST',
      contentType: 'multipart/form-data',

      formSubmit: function(form){
        var formData = new FormData(form);

        this.request({
          url: form.action,
          postBody: formData
        });
      },
      
      uploadFiles: function(url, files){
        var formData = new FormData();

        for (var i = 0, file; file = files[i]; i++) 
          formData.append(file.name, file);

        this.request({
          url: url,
          postBody: formData
        });
      },

      event_start: function(request){
        basis.dom.event.addHandler(request.xhr.upload, 'progress', REQUEST_PROGRESS_HANDLER, request);
        basis.net.ajax.AjaxProxy.prototype.event_start.call(this, request);
      },
      event_complete: function(request){
        basis.dom.event.removeHandler(request.xhr.upload, 'progress', REQUEST_PROGRESS_HANDLER, request);
        basis.net.ajax.AjaxProxy.prototype.event_complete.call(this, request);
      }
    });

    var REQUEST_PROGRESS_HANDLER = function(event){
      if (event.lengthComputable) 
        this.setState(basis.data.STATE.PROCESSING, { loaded: event.loaded, total: event.total });
    } 
  }
  else //IFrame
  {
    var IFrameRequest = basis.net.proxy.Request.subclass({
      state: basis.data.STATE.UNDEFINED,
      inprogress: false,

      init: function(){
        basis.net.proxy.Request.prototype.init.call(this);

        this.frame = createIFrame();

        basis.dom.event.addHandlers(this.frame, { load: this.onLoad }, this);
      },
      onLoad: function(event){
        if (this.inprogress)
        {
          this.processResponse();

          if (this.isSuccessful())
            this.proxy.event_success(this);
          else
            this.proxy.event_failure(this);

          this.proxy.event_complete(this);

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
        this.update({
          responseXML: doc && doc.body && doc.body.innerHTML
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

        this.proxy.event_start(this);
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
          this.proxy.event_abort(this);
        }
      },
      destroy: function(){
        this.removeFrame();
        delete this.frame;
      }
    });

    FileUploader = basis.net.proxy.Proxy.subclass({
      requestClass: IFrameRequest,

      formSubmit: function(form){
        this.request({ form: form });
      }
    });
  }

  // exports
  module.exports = {
    FileUploader: FileUploader
  }
