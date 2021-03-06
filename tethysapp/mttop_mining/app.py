from tethys_sdk.base import TethysAppBase, url_map_maker


class MountainTopMining(TethysAppBase):
    """
    Tethys app class for Mountain Top Mining.
    """

    name = 'Mountain Top Mining'
    index = 'mttop_mining:home'
    icon = 'mttop_mining/images/photo.png'
    package = 'mttop_mining'
    root_url = 'mttop-mining'
    color = '#2ecc71'
    description = 'This is a web app which will caclulate the volume of mountain to be removed in a top cut mining operation'
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
                    UrlMap(name='TechDoc',
                           url='mttop-mining/TechDoc',
                           controller='mttop_mining.controllers.TechDoc'),
                    UrlMap(name='HelpFile',
                           url='mttop-mining/HelpFile',
                           controller='mttop_mining.controllers.HelpFile')
        )

        return url_maps