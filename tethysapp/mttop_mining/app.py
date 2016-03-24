from tethys_sdk.base import TethysAppBase, url_map_maker


class MountainTopMining(TethysAppBase):
    """
    Tethys app class for Mountain Top Mining.
    """

    name = 'Mountain Top Mining'
    index = 'mttop_mining:home'
    icon = 'mttop_mining/images/icon.gif'
    package = 'mttop_mining'
    root_url = 'mttop-mining'
    color = '#2ecc71'
    description = 'Place a brief description of your app here.'
    enable_feedback = False
    feedback_emails = []

        
    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (UrlMap(name='home',
                           url='mttop-mining',
                           controller='mttop_mining.controllers.home'),
        )

        return url_maps