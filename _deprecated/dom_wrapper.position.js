
     /**
      * Indicates that child nodes are sensetive for it's position. If true positionChanged
      * event will be fired for child nodes on child nodes permutation. 
      * @type {boolean}
      */
      positionDependent: false,


  var DomMethodsMixin = {

    // position trace properties
    positionUpdateTimer_: null,
    minPosition_: 1E12,
    maxPosition_: 0,

    updatePositions_: function(pos1, pos2){
      if (this.positionDependent)
      {
        this.minPosition_ = Math.min(this.minPosition_, pos1, pos2);
        this.maxPosition_ = Math.max(this.maxPosition_, pos1, pos2);
        if (!this.positionUpdateTimer_)
        {
          this.positionUpdateTimer_ = function(){
            var len = Math.min(this.maxPosition_ + 1, this.childNodes.length);

            var gnode = this.childNodes[this.minPosition_];
            var group = gnode && gnode.groupNode;
            var gpos = this.minPosition_;
            if (group)
              gpos = group.childNodes.indexOf(gnode);

            for (var i = this.minPosition_; i < len; i++, gpos++)
            {
              var node = this.childNodes[i];
              if (node.groupNode != group)
              {
                gpos = 0;
                group = node.groupNode;
              }
              node.dispatch('updatePosition', i, gpos);
            }

            delete this.minPosition_;
            delete this.maxPosition_;
            delete this.positionUpdateTimer_;
          };
          TimeEventManager.add(this, 'positionUpdateTimer_', Date.now());
        }
      }
    }

  };