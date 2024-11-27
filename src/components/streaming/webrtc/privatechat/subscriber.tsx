/* eslint-disable camelcase */
import classnames from 'classnames';
import * as React from 'react';
import { isMobile } from 'react-device-detect';
import withAntMedia from 'src/antmedia';
import { WEBRTC_ADAPTOR_INFORMATIONS } from 'src/antmedia/constants';
import { WebRTCAdaptorConfigs, WebRTCAdaptorProps } from 'src/antmedia/interfaces';
import { StreamSettings } from 'src/interfaces';
import { streamService } from 'src/services';
import videojs from 'video.js';

interface IProps extends WebRTCAdaptorProps {
  settings: StreamSettings;
  configs: Partial<WebRTCAdaptorConfigs>;
  setStreamRef?: Function;
}

class Subscriber extends React.PureComponent<IProps> {
  // eslint-disable-next-line react/static-property-placement
  static defaultProps = {
    setStreamRef: () => { }
  };

  private streamId: string;

  private player: videojs.Player;

  private availableStreamIds = [];

  componentDidMount(): void {
    const { setStreamRef = null } = this.props;
    if (setStreamRef) {
      setStreamRef({
        play: this.play.bind(this),
        stop: this.stop.bind(this),
        close: this.close.bind(this)
      });
    }
  }

  async handler(info: WEBRTC_ADAPTOR_INFORMATIONS, obj: any) {
    const { webRTCAdaptor, settings } = this.props;
    if (info === WEBRTC_ADAPTOR_INFORMATIONS.INITIALIZED) {
      const token = await streamService.getSubscriberToken({ streamId: this.streamId, settings });
      webRTCAdaptor.play(this.streamId, token);
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.NEW_STREAM_AVAILABLE) {
      const activeStream = this.availableStreamIds.find((id) => id === obj.streamId);
      if (!activeStream) {
        this.availableStreamIds.push(obj.streamId);
        this.createRemoteVideo(obj.stream);
      }
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PLAY_FINISHED) {
      this.availableStreamIds = this.availableStreamIds.filter((id) => id !== obj.streamId);
      this.removeRemoteVideo();
      setTimeout(() => {
        webRTCAdaptor.getStreamInfo(obj.streamId);
      }, 3000);
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.STREAM_INFORMATION) {
      if (obj.streamId === this.streamId) {
        const token = await streamService.getSubscriberToken({ streamId: obj.streamId, settings });
        webRTCAdaptor.play(obj.streamId, token);
      }
    }
  }

  async cbErrorHandler(error: string) {
    if (error === 'no_stream_exist') {
      const { webRTCAdaptor, initWebRTCAdaptor } = this.props;
      if (!webRTCAdaptor) {
        initWebRTCAdaptor(this.handler.bind(this), this.cbErrorHandler.bind(this));
      } else {
        this.streamId && webRTCAdaptor.getStreamInfo(this.streamId);
      }
    }
  }

  createRemoteVideo(stream: any) {
    const { classNames, configs } = this.props;
    const video = document.createElement('video') as any;
    video.setAttribute('id', configs.remoteVideoId);
    video.setAttribute('class', classnames('video-js vjs-fluid', classNames));
    video.autoplay = true;
    video.muted = false;
    video.controls = false;
    video.playsInline = true;
    video.srcObject = stream;
    document.querySelector('.private-streaming-container').append(video);
    if (!isMobile) {
      const player = videojs(configs.remoteVideoId, {
        liveui: true,
        controls: true,
        autoplay: true
      });
      player.on('error', () => {
        player.error(null);
      });
      player.one('play', () => {
        this.player = player;
      });
    }
  }

  removeRemoteVideo() {
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
  }

  async play(streamId: string) {
    const {
      initWebRTCAdaptor, initialized, webRTCAdaptor, settings
    } = this.props;
    this.streamId = streamId;
    if (initialized) {
      const token = await streamService.getSubscriberToken({ streamId, settings });
      webRTCAdaptor.play(streamId, token);
      return;
    }

    initWebRTCAdaptor(this.handler.bind(this), this.cbErrorHandler.bind(this));
  }

  close() {
    this.streamId = null;
  }

  stop() {
    const { leaveSession } = this.props;
    this.streamId = '';
    this.availableStreamIds = [];
    leaveSession && leaveSession();
  }

  render() {
    return null;
  }
}

export default withAntMedia(Subscriber);
