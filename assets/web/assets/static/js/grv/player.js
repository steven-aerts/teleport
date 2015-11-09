/*
Copyright 2015 Gravitational, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
function Player(rid, term) {
    this.rid = rid;
    this.term = term;
    this.started = true;
    this.chunk = 1;
}

Player.prototype.start = function() {
    this.started = true;
    this.iterChunks(this.chunk);
}

Player.prototype.stop = function() {
    this.started = false;
}

Player.prototype.iterChunks = function(chunk) {
    console.log("iterChunks: ", chunk);
    var self = this;
    $.ajax({
        url: grv.path("api", "records", self.rid, "chunks") + "?"+$.param([{name: "start", value: chunk}, {name: "end", value: chunk+1}]),
        type: "GET",
        dataType: 'json',
        success: function(data) {
            if(data.length == 0) {
                self.term.write("end of playback");
                return
            }
            self.writeChunk(data, 0, function(){
                self.iterChunks(chunk+data.length);
            });
        }.bind(this),
        error: function(xhr, status, err) {
            toastr.error("failed to connect to server, try again");
        }.bind(this)
    });
}

Player.prototype.writeChunk = function(chunks, i, fin) {
    var self = this;
    if(!self.started) {
        return;
    }
    var ms = chunks[i].delay/1000000;
    if(ms > 300) {
        ms = 300; // fast forward long periods of inactivity
    }
    setTimeout(function() {
        self.term.write(atob(chunks[i].data));
        if(i + 1 < chunks.length) {
            self.writeChunk(chunks, i + 1, fin);
        } else {
            fin();
        }
    }, ms);
}